import { Message } from "discord.js";
import Merari from "../Merari";
import Command from "../Model/Command/Command";
import Context from "../Model/Command/Context";
import Response, { ResponseStatus } from "../Model/Command/Response";
import Config from "../Model/Config/Config";
import IManager from "../Model/Manager/IManager";
import Embed from "../Util/Embed";
import Logger from "../Util/Logger";

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

    register(cmd: Command)
    {
        this.commands.push(cmd);
    }
    
    async run() {
        this.logger.msg(this).starting();

        this.register(new Command(null, 'help', [
            ['text']
        ], async (ctx) => {
            return Response.ok()
        }));
    }

    async handleMessage(msg: Message)
    {
        const clean = msg.content.trim();

        if(clean.startsWith(this.config.getString('prefix')))
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
            let response: Response;

            if(command)
            {
                const context = new Context(msg, command);

                let argStruct = command.args.find(a => a.length == args.length);
               
                if(!argStruct)
                {
                    argStruct = [...command.args].sort((a,b) => {
                        return b.length - a.length
                    }).find(a => {
                        return a.length <= args.length;
                    });
                }

                if(argStruct)
                {
                    context.argStruct = argStruct;

                    // TODO

                    response = await command.execute(context);
                } else {
                    response = Response.bad(`Your command did not match any argument syntax for ${cmd}`);
                }
            } else {
                response = Response.bad([
                    `Unknown command alias.`,
                    `*Merari has responded, because you have used prefix.*`
                ]);
            }

            switch(response.status)
            {
                case ResponseStatus.OK:
                    await msg.react('🔥');
                    break;
                case ResponseStatus.ERROR:
                    await msg.react('❌');
                    await Embed.send(msg, 'Error', [
                        'Merari has encountered an error while executing your command',
                        response.message ?? ''
                    ]);
                    break;
                case ResponseStatus.BAD_ARG:
                    await msg.react('⚠️');
                    await Embed.send(msg, 'Bad request', [
                        'Command syntax was incorrect'
                    ])
                    break;
                case ResponseStatus.BAD_REQUEST:
                    await msg.react('⚠️');
                    await Embed.send(msg, 'Bad request', [
                        response.message ?? ''
                    ])
                    break;
                case ResponseStatus.FORBIDDEN:
                    await msg.react('⛔');
                    await Embed.send(msg, 'Insufficient permissions', [
                        'You are missing permission',
                        `**${response.permission}**`,
                        response.message ?? ''
                    ]);
                    break;
                case ResponseStatus.EXCEPTION:
                    await msg.react('❌');
                    await Embed.send(msg, 'Error', [
                        'Merari has encountered an (yet) unexpected error',
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
        }
    }
}