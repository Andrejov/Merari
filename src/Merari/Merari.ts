import { Client, Intents } from "discord.js";
import ClientManager from "./Core/ClientManager";
import CommandManager from "./Core/CommandManager";
import ConfigManager from "./Core/ConfigManager";
import ExtensionManager from "./Core/ExtensionManager";
import Logger, { LogLevel } from "./Util/Logger";
import Version from "./Util/Version";

export default class Merari
{
    logger: Logger;
    client: Client;

    configManager: ConfigManager;
    commandManager: CommandManager;
    extensionManager: ExtensionManager;
    clientManager: ClientManager;

    constructor(logger?: Logger)
    {
        this.logger = logger ?? new Logger();

        this.configManager = new ConfigManager(this, this.logger.child("CFGMGR"));
        this.commandManager = new CommandManager(this, this.logger.child("CMDMGR"));
        this.extensionManager = new ExtensionManager(this, this.logger.child("EXTMGR"));
        this.clientManager = new ClientManager(this, this.logger.child("CLIENTM"));

        this.client = this.clientManager.getClient();
    }

    async run(): Promise<void>
    {
        this.logger.greet(`Starting Merari bot v.${Version.get()} ...`);

        await this.configManager.run();
        await this.commandManager.run();
        await this.extensionManager.run();

        await this.clientManager.run();
    }

}