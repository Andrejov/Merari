import CommandManager from "../../Core/CommandManager";
import ExtensionManager from "../../Core/ExtensionManager";
import PermissionsManager from "../../Core/PermissionsManager";
import Merari from "../../Merari";
import Logger from "../../Util/Logger";
import Scheduler from "../../Util/Scheduler";
import { ArgumentStructure } from "../Command/Argument";
import Command from "../Command/Command";
import Context from "../Command/Context";
import { Permission } from "../Command/Permissions";
import Response from "../Command/Response";
import Extension from "./Extension";

export default class ExtensionShell
{
    private manager: ExtensionManager
    private loader: ExtensionShellLoader;
    private extension(): Extension {
        return this.loader.extension as Extension;
    }

    constructor(manager: ExtensionManager, extension: ExtensionShellLoader)
    {
        this.manager = manager;
        this.loader = extension;
    }

    getScheduler(): Scheduler
    {
        return this.manager.scheduler;
    }

    get<T extends Extension>(ext: new (bot: Merari, logger: Logger, shell: ExtensionShell) => T): T
    {
        return this.manager.get<T>(ext);
    }

    register(
        alias: string | string[],
        args: ArgumentStructure | ArgumentStructure[],
        execute: 
            ((ctx: Context) => Promise<Response>) |
            { [key: string]:  (context: Context) => Promise<Response>},
        permission?: Permission
    ) {
        this.commands().register(new Command(
            this.extension(),
            alias,
            args,
            execute,
            permission
        ));
    }
    
    scheduleRepeatingTask(callback: () => void | Promise<void>, time: number)
    {
        return this.getScheduler().scheduleRepeatingTask(this.extension(), callback, time);
    }

    scheduleDelayedTask(extension: Extension, callback: () => void | Promise<void>, time: number)
    {
        return this.getScheduler().scheduleDelayedTask(this.extension(), callback, time);
    }

    commands(): CommandManager
    {
        return this.manager.bot.commandManager;
    }

    extensions(): ExtensionManager
    {
        return this.manager.bot.extensionManager;
    }

    permissions(): PermissionsManager
    {
        return this.manager.bot.permissionsManager;
    }
}

export class ExtensionShellLoader
{
    extension?: Extension;
}