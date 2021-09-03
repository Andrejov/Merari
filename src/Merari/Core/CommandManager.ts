import { Guild, GuildChannel, GuildMember, Message, User } from "discord.js";
import Merari from "../Merari";
import Argument, { ArgumentStructure, ArgumentType, ArgumentValue } from "../Model/Command/Argument";
import Command from "../Model/Command/Command";
import Context from "../Model/Command/Context";
import Response, { ResponseStatus } from "../Model/Command/Response";
import Config from "../Model/Config/Config";
import IManager from "../Model/Manager/IManager";
import Util from "../Util/Util";
import Logger from "../Util/Logger";
import Extension from "../Model/Extension/Extension";

export default class CommandManager implements IManager
{
    bot: Merari;
    logger: Logger;
    config: Config;

    commands: Command[] = [];

    constructor(bot: Merari, logger: Logger)
    {
        this.bot = bot;
        this.logger = logger;
        this.config = bot.configManager.commandConfig;
    }

    getPrefix(): string
    {
        return this.config.getString('prefix')
    }

    register(cmd: Command)
    {
        this.commands.push(cmd);

        this.sort();
    }

    unregister(match?: Command | string | Extension)
    {
        let filter = (e: Command) => true;

        if(match instanceof Command)
        {
            filter = e => e === match;
        } else if(match instanceof Extension)
        {
            filter = e => e.extension === match;
        } else if(match) {
            filter = e => e.aliases.indexOf(match) > -1
        }

        this.commands = this.commands.filter(c => !filter(c));

        this.sort();
    }

    sort()
    {
        this.commands.sort((a,b) => 
            (a.aliases[0] > b.aliases[0]) ? 1 :
            (
                (b.aliases[0] > a.aliases[0] ? -1 : 0)
            )
        )
    }
    
    async run() {
        this.logger.msg(this).starting();

        // this.register(new Command(null, 'echo', [
        //     ArgumentStructure.make('main', "text")
        // ], async (ctx) => {
        //     await Util.embed(ctx.message, "Echo", [
        //         '```',
        //         ...ctx.args.map((a,i) => `${i}: ${a}`),
        //         '```'
        //     ]);
        //     return Response.ok()
        // }));
        // this.register(new Command(null, 'ping', [
        //     ArgumentStructure.make('main'),
        //     ArgumentStructure.make('mention', 'member')
        // ], async ctx => {
        //     if(ctx.argStruct.name == 'mention')
        //     {
        //         await ctx.message.reply(`${ctx.args[0] as User}`)
        //     }else if(ctx.argStruct.name == 'main') {
        //         await Util.embed(ctx.message, 'Ping', [
        //             `Latency:`,
        //             `End-to-end: ${Date.now() - ctx.message.createdTimestamp} ms`,
        //             `Websocket: ${ctx.message.client.ws.ping} ms`
        //         ])
        //     }

        //     return Response.ok(); 
        // }))
        // this.register(new Command(null, 'ci', [
        //     ArgumentStructure.make('main', 'vchannel'),
        //     ArgumentStructure.make('second', 'vchannel', 'text')
        // ], async ctx => {
        //     await Util.embed(ctx.message, 'ci', [
        //         (ctx.args[0] as GuildChannel).name,
        //         ctx.args[1] + ""
        //     ])

        //     return Response.ok();
        // }))
    }

    async handleMessage(msg: Message)
    {
        const clean = msg.content.trim();
        const prefix = this.getPrefix();

        if(clean.startsWith(prefix))
        {
            const noPrefix = clean.substring(1);
            const cmd = noPrefix.split(' ')[0].toLowerCase();
            const strArgs = noPrefix.substr(cmd.length).trim();
            const args = strArgs
                .split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g)
                .map(v => v.startsWith('"') && v.endsWith('"') ? v.substr(1, v.length - 2) : v);

            if(args.length > 0 && args[args.length - 1].trim().length == 0)
            {
                args.pop();
            }

            const command = this.commands.find(c => c.aliases.indexOf(cmd) > -1);
            let response: Response | undefined = await (async () => {
                if(command)
                {
                    this.logger.trace(`Command ${cmd} received with ${args.length} args`);

                    // TODO: Permission check
                    const permission = command.permission;

                    if(!await this.bot.permissionsManager.hasPermission(
                        msg.member as GuildMember,
                        permission
                    )) {
                        return Response.perm(permission ?? 'ANY');
                    }

                    const context = new Context(msg, command, cmd);

                    let argStruct = command.args.find(a => a.maxLength() == args.length);
                
                    if(!argStruct)
                    {
                        argStruct = [...command.args].sort((a,b) => {
                            return b.maxLength() - a.maxLength()
                        }).find(a => {
                            return a.minLength() <= args.length;
                        });
                    }

                    if(argStruct)
                    {
                        context.argStruct = argStruct;

                        this.logger.trace(`Found arg struct with ${argStruct.minLength()}/${argStruct.maxLength()} args`)

                        while(argStruct.maxLength() < args.length)
                        {
                            if(args.length == 1)
                            {
                                break;
                            }

                            args.push(
                                [args.pop(), args.pop()].reverse().join(' ')
                            )
                        }

                        for(let i = 0; i < argStruct.maxLength(); i++)
                        {
                            try {
                                const parsed = await Argument.parse(
                                    msg.guild as Guild,
                                    args[i],
                                    argStruct.structure[i]
                                )
        
                                if(parsed.valid)
                                {
                                    context.args.push(parsed.value);
                                } else {
                                    return Response.arg(i, [
                                        Argument.usageMessage(prefix, cmd, argStruct, i),
                                        `Additional info: ${parsed.msg}`
                                    ])
                                    break;
                                }
                            } catch (error) {
                                return Response.except(error, `Could not parse argument #${i}`);
                                break;
                            }
                        }

                        try {
                            return await command.execute(context);
                        } catch (error) {
                            return Response.except(error);
                        }
                    } else {
                        return Response.bad([
                            `Your command did not match any argument syntax for ${cmd}`,
                            ...Argument.usagesMessage(prefix, command)
                        ]);
                    }
                } else {
                    return Response.bad([
                        `Unknown command alias.`,
                        `*Merari has responded, because you have used prefix.*`
                    ]);
                }
            })();

            switch(response.status)
            {
                case ResponseStatus.OK:
                    await msg.react('🔥');
                    break;
                case ResponseStatus.ERROR:
                    await msg.react('❌');
                    await Util.embed(msg, 'Error', [
                        'Merari has encountered an error while executing your command',
                        ...response.message
                    ]);
                    break;
                case ResponseStatus.BAD_ARG:
                    await msg.react('⚠️');
                    await Util.embed(msg, 'Bad request', [
                        'Command syntax was incorrect',
                        ...response.message
                    ])
                    break;
                case ResponseStatus.BAD_REQUEST:
                    await msg.react('⚠️');
                    await Util.embed(msg, 'Bad request', [
                        ...response.message
                    ])
                    break;
                case ResponseStatus.FORBIDDEN:
                    await msg.react('⛔');
                    await Util.embed(msg, 'Insufficient permissions', [
                        'You are missing permission',
                        `**${response.permission}**`,
                        ...response.message
                    ]);
                    break;
                case ResponseStatus.EXCEPTION:
                    await msg.react('❌');
                    await Util.embed(msg, 'Error', [
                        'Merari has encountered an (yet) unexpected error',
                        ...response.message,
                        'Verbose data:',
                        '```',
                        response.exception + "",
                        '```'
                    ]);
                    break;
                case ResponseStatus.DELETE:
                    await msg.delete();
                    break;
            }

            this.logger.debug(`${msg.author.tag} has successfully executed command ${cmd} with status ${response.status}`);
        }
    }
}