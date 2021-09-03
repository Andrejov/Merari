import { Channel, GuildMember, Message, TextBasedChannels } from "discord.js";
import { ArgumentStructure } from "../Merari/Model/Command/Argument";
import Context from "../Merari/Model/Command/Context";
import Response from "../Merari/Model/Command/Response";
import Extension from "../Merari/Model/Extension/Extension";
import Util from "../Merari/Util/Util";

export default class MinesweeperExtension extends Extension
{
    public map = new Map<string, Minesweeper>();

    async enable()
    {
        this.shell.register(
            ['minesweeper', 'mine', 'ms'],
            [
                ArgumentStructure.make('view'),
                ArgumentStructure.make('point', 'number', 'number')
            ],
            async ctx => {
                return await this.minesweeper(ctx);
            }
        )
        this.shell.register(
            ['mineflag', 'mf', 'minef'],
            [
                ArgumentStructure.make('point', 'number', 'number')
            ],
            async ctx => {
                return await this.minesweeper(ctx);
            }
        )
    }

    async minesweeper(ctx: Context): Promise<Response>
    {
        let mine = this.map.get(ctx.channel?.id ?? '');
        let created = false;

        if(!mine)
        {
            mine = new Minesweeper(ctx.message);

            this.map.set(ctx.channel?.id ?? '', mine);

            created = true;
        }

        const oldMessage = mine.message;

        let badArg = -1;
        if(!created)
        {
            if(ctx.argStruct.name == 'point')
            {
                const size = mine.size;

                ctx.args.every((a,i) => {
                    if(a < 1 || a > size)
                    {
                        badArg = i;
                        return false;
                    }

                    return true;
                })

                if(badArg == -1)
                {
                    const x = ctx.args[0] as number - 1;
                    const y = ctx.args[1] as number - 1;
                    const flag = ctx.command.aliases[0] == 'mineflag';

                    // mine.poke(x,y, ctx.command.aliases[0] == 'mineflag');
                    if(mine.stage == 'UNSET')
                    {
                        mine.setMines(x,y);

                        mine.stage = 'GAME';
                        // mine.poke(x,y, false);
                        mine.recursiveUnhide(x,y);
                        mine.updateView();
                    } else if(mine.stage == 'GAME')
                    {
                        const spot = mine.mines[y][x];

                        if(flag)
                        {
                            if(spot == 'MINE_HIDDEN')
                            {
                                mine.mines[y][x] = 'MINE_MARKED'
                            } else if(spot == 'MINE_MARKED')
                            {
                                mine.mines[y][x] = 'MINE_HIDDEN'
                            } else if(spot == 'NONE_HIDDEN')
                            {
                                mine.mines[y][x] = 'NONE_MARKED'
                            } else if(spot == 'NONE_MARKED')
                            {
                                mine.mines[y][x] = 'NONE_HIDDEN';
                            }
                        } else {
                            if(spot == 'MINE' || spot == 'MINE_HIDDEN' || spot == 'MINE_MARKED')
                            {
                                mine.stage = 'END';
                            } else if(spot == 'NONE') {
                                // nothing
                            } else if(spot == 'NONE_HIDDEN' || spot == 'NONE_MARKED')
                            {
                                mine.recursiveUnhide(x,y);
                            }
                        }

                        mine.updateView();
                    }
                }
            }
        }

        if(mine.stage == 'END')
        {
            this.map.delete(ctx.channel?.id ?? '');
        }

        mine.message = await Util.embed(mine.channel, 'Minesweeper', [
            `**Attention: this feature is experimental and may be bugged**`,
            // JSON.stringify(mine.mines),
            // JSON.stringify(mine.stage),
            ...created ? ['New game'] : [],
            ...mine.stage == 'UNSET' ? ['Start by pointing at any spot'] : [],
            ...mine.stage == 'END' ? ['Game has ended'] : [],
            ...badArg != -1 ? [`Argument ${['x','y'][badArg]} is incorrect`] : [],
            `Reveal spot command: $mine **<x> <y>**`,
            `Flag mine command: $mineflag **<x> <y>**`,
            `View mines: $mine`,
            ``,
            '🟦🟦' + '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣'.split(' ').splice(0, mine.size).join('') + '🟦',
            '🟦' + '🟪'.repeat(mine.size + 2),
            ...mine.view.map((row, ridx) => {
                return '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣'.split(' ')[ridx] + '🟪' + row.map(cell => {
                    if(cell == 'EMPTY') {
                        return '⬛';
                    } else if(cell == 'MINE') {
                        return '💥';
                    } else if(cell == 'BLOCK') {
                        return '⬜';
                    } else if(cell == 'MARK') {
                        return '❎';
                    } else if(cell == 'NEAR_1') {
                        return '1️⃣';
                    } else if(cell == 'NEAR_2') {
                        return '2️⃣';
                    } else if(cell == 'NEAR_3') {
                        return '3️⃣';
                    } else if(cell == 'NEAR_4') {
                        return '4️⃣';
                    } else if(cell == 'NEAR_5') {
                        return '5️⃣';
                    } else if(cell == 'NEAR_6') {
                        return '6️⃣';
                    } else if(cell == 'NEAR_7') {
                        return '7️⃣';
                    } else if(cell == 'NEAR_8') {
                        return '8️⃣';
                    } else {
                        return cell;
                    }
                }).join('') + '🟪'
            }),
            '🟦' + '🟪'.repeat(mine.size + 2),
        ])

        if(oldMessage)
        {
            await oldMessage.delete().catch(() => {});
        }

        return Response.ok();
    }

    async disable()
    {
        this.map.clear();
    }
}

export class Minesweeper
{
    channel: TextBasedChannels;
    caller: GuildMember;
    message?: Message;

    stage: MinesweeperState = 'UNSET';
    size = 5;
    mineCount = 5;

    view: MinesweeperTile[][];
    mines: MinesweeperMine[][];

    constructor(msg: Message)
    {
        this.channel = msg.channel;
        this.caller = msg.member as GuildMember;

        this.view = [];
        this.mines = new Array(this.size).fill(0).map(() => {
            return new Array(this.size).fill('NONE_HIDDEN')
        });

        this.updateView();
    }

    setMines(sx: number, sy: number)
    {
        this.mines = new Array(this.size).fill(0).map(() => {
            return new Array(this.size).fill('NONE_HIDDEN')
        });

        for (let i = 0; i < this.mineCount; i++) {
            const doMine = () => {
                const x = Math.floor(Math.random() * this.size);
                const y = Math.floor(Math.random() * this.size);

                if(sx == x && sy == y) return true;
                if(this.mines[y][x] == 'MINE_HIDDEN') return true;

                this.mines[y][x] = 'MINE_HIDDEN';
            }

            while(doMine()) {};
        }

        return this.view;
    }

    poke(x: number, y: number, flag: boolean)
    {
        
    }

    recursiveUnhide(x: number, y: number)
    {
        if(this.mines[y][x] == 'NONE_HIDDEN' || this.mines[y][x] == 'NONE_MARKED')
        {
            this.mines[y][x] = 'NONE';
            // console.log(this.mines);
        } else {
            return;
        }

        const slots = [
            // [-1, -1],
            [0, -1],
            // [1, -1],
            [1, 0],
            // [1, 1],
            [0, 1],
            // [-1, 1],
            [-1, 0]
        ]

        slots.forEach(([xm, ym]) => {
            const fx = x + xm;
            const fy = y + ym;

            if(fx > 0 && fx < this.size &&
                fy > 0 && fy < this.size) {
                const slot = this.mines[fy][fx];
            
                if(slot == 'NONE_HIDDEN' || slot == 'NONE_MARKED')
                {
                    this.recursiveUnhide(fx, fy);
                }
            }
        })
    }

    updateView()
    {
        if(this.stage == 'END')
        {
            this.view = new Array(this.size).fill(0).map((r, y) => {
                return new Array(this.size).fill(0).map((c, x) => {
                    return (this.mines[y][x] == 'MINE_HIDDEN' || 
                            this.mines[y][x] == 'MINE' || 
                            this.mines[y][x] == 'MINE_MARKED') ? 'MINE' : 'BLOCK';
                })
            });
        } else if (this.stage == 'UNSET')
        {
            this.view = new Array(this.size).fill(0).map((r, y) => {
                return new Array(this.size).fill(0).map((c, x) => {
                    return 'BLOCK';
                })
            });
        } else if(this.stage == 'GAME')
        {
            this.view = new Array(this.size).fill(0).map((r, y) => {
                return new Array(this.size).fill(0).map((c, x) => {
                    const cell = this.mines[y][x];

                    if(cell == 'MINE_HIDDEN' || cell == 'NONE_HIDDEN')
                    {
                        return 'BLOCK';
                    } else if(cell == 'MINE_MARKED' || cell == 'NONE_MARKED')
                    {
                        return 'MARK';
                    } else if(cell == 'MINE')
                    {
                        return 'MINE';
                    } else if(cell == 'NONE')
                    {
                        let calc = 0;

                        const slots = [
                            [-1, -1],
                            [0, -1],
                            [1, -1],
                            [1, 0],
                            [1, 1],
                            [0, 1],
                            [-1, 1],
                            [-1, 0]
                        ]

                        slots.forEach(([xm, ym]) => {
                            const fx = x + xm;
                            const fy = y + ym;

                            if(fx > 0 && fx < this.size &&
                                fy > 0 && fy < this.size) {
                                const slot = this.mines[fy][fx];
                            
                                if(slot == 'MINE' || slot == 'MINE_HIDDEN' || slot == 'MINE_MARKED')
                                {
                                    calc += 1;
                                }
                            }
                        })

                        if(calc == 0)
                        {
                            return 'EMPTY';
                        } else {
                            return ('NEAR_' + calc) as MinesweeperTile;
                        }
                    } else {
                        return 'EMPTY';
                    }
                })
            });
        }
    }
}

export type MinesweeperState = 'UNSET' | 'GAME' | 'END';
export type MinesweeperMine = 'NONE' | 'MINE' | 'MINE_MARKED' | 'NONE_MARKED' | 'MINE_HIDDEN' | 'NONE_HIDDEN';
export type MinesweeperTile = 'BLOCK' | 'EMPTY' | 'MINE' | 'MARK' |
                              'NEAR_1' | 'NEAR_2' | 'NEAR_3' | 'NEAR_4' | 'NEAR_5' | 'NEAR_6' | 'NEAR_7' | 'NEAR_8';