import { Channel, GuildMember, TextChannel, User, VoiceChannel } from "discord.js";
import { Context } from "vm";
import Extension from "../Extension/Extension";
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
        execute: (context: Context) => Promise<Response>,
        permission?: Permission)
    {
        this.extension = ext;
        this.aliases = Array.isArray(alias) ? alias : [alias];

        if(args.length == 0)
        {
            this.args = [[]];
        } else {
            if(Array.isArray(args[0]))
            {
                this.args = args as ArgumentStructure[];
            } else {
                this.args = [args as ArgumentStructure];
            }
        }

        this.execute = execute;
        this.permission = permission;
    }

}

export type ArgumentTypeBase = 'text' | 'number' | 
                               'user' | 'member' |
                               'channel' | 'tchannel' | 'vchannel';
export type ArgumentType = ArgumentTypeBase | `o${ArgumentTypeBase}`;
export type ArgumentStructure = ArgumentType[];

export type ArgumentValue = string | number |
                            User | GuildMember |
                            Channel | TextChannel | VoiceChannel |
                            undefined;