import { Channel, GuildMember, TextBasedChannels, TextChannel, User, VoiceBasedChannelTypes, VoiceChannel } from "discord.js";
import Extension from "../Extension/Extension";
import { ArgumentStructure } from "./Argument";
import Context from "./Context";
import { Permission } from "./Permissions";
import Response from "./Response";

export default class Command
{
    aliases: string[];
    args: ArgumentStructure[];
    permission?: Permission;

    execute: (context: Context) => Promise<Response>;

    extension?: Extension | null;

    constructor(
        ext: Extension | null | undefined, 
        alias: string | string[], 
        args: ArgumentStructure | ArgumentStructure[], 
        execute: 
            ((context: Context) => Promise<Response>) | 
            ((context: Context) => Promise<Response>)[] |
            { [key: string]:  (context: Context) => Promise<Response>},
        permission?: Permission)
    {
        this.extension = ext;
        this.aliases = Array.isArray(alias) ? alias : [alias];

        this.args = Array.isArray(args) ? args : [args];

        if(this.args.length == 0)
        {
            this.args.push(
                ArgumentStructure.make('empty')
            )
        }

        if(Array.isArray(execute))
        {
            this.execute = async ctx => {
                return await execute[
                    this.args.indexOf(ctx.argStruct)
                ](ctx);
            }
        } else if(typeof execute === 'object') {
            this.execute = async ctx => {
                return await execute[ctx.argStruct.name](ctx)
            }
        } else {
            this.execute = ext ? execute.bind(ext) : execute;
        }

        this.permission = permission;
    }

}