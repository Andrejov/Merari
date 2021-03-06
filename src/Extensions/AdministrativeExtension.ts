import { GuildMember } from "discord.js";
import Argument, { ArgumentStructure } from "../Merari/Model/Command/Argument";
import Response from "../Merari/Model/Command/Response";
import Extension from "../Merari/Model/Extension/Extension";
import Util from "../Merari/Util/Util";

export default class AdministrativeExtension extends Extension
{
    async enable()
    {
        this.shell.register(
            ['ping', 'pong', 'hello', 'merari', ''], 
            [
                ArgumentStructure.make('main')
            ], async ctx => {
                let title = 'Ping';

                if(ctx.alias == 'pong')
                {
                    title = 'Pong'
                } else if(ctx.alias == 'hello') {
                    title = 'Hello :3'
                } else if(ctx.alias == 'merari' || ctx.alias == 'hello' || ctx.alias == '')
                {
                    title = 'Status'
                }

                const ete = Date.now() - ctx.message.createdTimestamp;

                await Util.embed(ctx.message, title, [
                    `Mode: **${this.bot.configManager.mainConfig.getBool('development') ? 'development' : 'production'}**`,
                    `Uptime: ${this.bot.clientManager.getUptime()}`,
                    `Latency:`,
                    '```',
                    `End-to-end: ${ete > 0 ? ete : '?'} ms`,
                    `Websocket: ${ctx.message.client.ws.ping} ms`,
                    '```'
                ])

                return Response.ok();
            }, 
            'ANY'
        )

        this.shell.register(
            ['help', 'command', 'commands', 'cmd', 'cmds'],
            [
                ArgumentStructure.make('main'),
                ArgumentStructure.make('detail', 'text')
            ],
            async ctx => {
                if(ctx.argStruct.name == 'detail')
                {
                    const find = ctx.args[0] as string;

                    const cmd = this.bot.commandManager.commands.find(c => c.aliases.indexOf(find) != -1);

                    if(cmd)
                    {
                        Util.embed(ctx.message, `Command syntax`, [
                            ...Argument.usagesMessage(
                                this.bot.commandManager.getPrefix(),
                                cmd
                            )
                        ])
                    } else {
                        return Response.arg(0, 'That command does not exist');
                    }
                } else {
                    Util.embed(ctx.message, 'Commands', [
                        'Avaliable Merari commands:',
                        '```',
                        `# ${'Command #'.padEnd(20, ' ')}# Provider #`,
                        ...this.bot.commandManager.commands.map(c => 
                            `  ${
                                (this.bot.commandManager.getPrefix() + c.aliases[0]).padEnd(20, ' ')
                            } ${
                                c.extension ? c.extension.getName() : 'none'
                            }`
                        ),
                        '```'
                    ])
                }

                return Response.ok();
            },
            'ANY'
        ) 

        this.shell.register(['extlist'], [],
            async ctx => {
                Util.embed(ctx.message, 'Extensions', [
                    'Currently loaded extensions:',
                    '```',
                    ...this.bot.extensionManager.extensions.map((e,i) => 
                        `..${
                            (i + 1).toString().padStart(3,'.')
                        }..${
                            e.getName().padEnd(20, '.')
                        }..${
                            this.bot.extensionManager.enabled.indexOf(e) == -1 ? '???' : '??????'
                        }`),
                    '```',
                    '*??? enabled;  ??? disabled*'
                ])

                return Response.ok();
            },
            'MERARI_OWNER'
        );

        this.shell.register(
            ['extdo'], 
                [
                ArgumentStructure.make('do', 'text')
            ], async ctx => {
                const find = (ctx.args[0] as string).toLowerCase();
                const ext = this.bot.extensionManager.extensions.find(e => e.getName().toLowerCase().indexOf(find) > -1)

                if(ext)
                {
                    const enabled = this.bot.extensionManager.enabled.indexOf(ext) > -1;

                    if(enabled)
                    {
                        await this.bot.extensionManager.disable(ext);
                    } else {
                        await this.bot.extensionManager.enable(ext);
                    }

                    Util.embed(ctx.message, 'Extension switch', [
                        `Successfully ${enabled ? 'disabled' : 'enabled'} extension \`${ext.getName()}\``
                    ])

                    return Response.ok();
                } else {
                    return Response.arg(0, 'Could not find that extension')
                }
            },
            'MERARI_OWNER'
        )

        this.shell.register(
            ['permcheck', 'pc'],
            [
                ArgumentStructure.make('main', 'text')
            ],
            async ctx => {
                const raw = ctx.args[0] as string;

                const perm = this.shell.permissions().tryParse(raw)

                const status = perm ? 
                    await this.shell.permissions()
                        .hasPermission(
                        ctx.member as GuildMember, 
                        perm
                    ) : undefined

                if(!perm)
                {
                    return Response.arg(0, 'This permission does not exist')
                }

                if(!status)
                {
                    return Response.perm(perm);
                }

                return Response.ok();
            },
            'ANY'
        )
    }
}