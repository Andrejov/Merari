import { Guild, GuildMember, Message, User } from "discord.js";
import Logger from "../../Util/Logger";
import Command, { ArgumentStructure, ArgumentValue } from "./Command";

export default class Context
{
    message: Message;
    member?: GuildMember;
    guild?: Guild;
    user: User;

    command: Command;
    args: ArgumentValue[] = [];
    argStruct: ArgumentStructure = [];

    constructor(message: Message, command: Command)
    {
        this.message = message;
        this.member = message.member ?? undefined;
        this.guild = message.guild ?? undefined;
        this.user = message.author;
        this.command = command;
    }
}