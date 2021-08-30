import { Guild, GuildMember, Message, TextBasedChannels, User } from "discord.js";
import Logger from "../../Util/Logger";
import { ArgumentValue, ArgumentStructure } from "./Argument";
import Command from "./Command";

export default class Context
{
    message: Message;
    member?: GuildMember;
    guild?: Guild;
    channel?: TextBasedChannels;
    user: User;

    command: Command;
    alias: string;
    args: ArgumentValue[] = [];
    argStruct: ArgumentStructure = new ArgumentStructure('', []);

    constructor(message: Message, command: Command, alias: string)
    {
        this.message = message;
        this.member = message.member ?? undefined;
        this.guild = message.guild ?? undefined;
        this.user = message.author;
        this.command = command;
        this.channel = message.channel;
        this.alias = alias;
    }
}