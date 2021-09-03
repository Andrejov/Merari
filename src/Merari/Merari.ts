import { Client } from "discord.js";
import { EventEmitter } from "tsee";
import ClientManager from "./Core/ClientManager";
import CommandManager from "./Core/CommandManager";
import ConfigManager from "./Core/ConfigManager";
import ExtensionManager from "./Core/ExtensionManager";
import PermissionsManager from "./Core/PermissionsManager";
import Logger, { LogLevel } from "./Util/Logger";
import Version from "./Util/Version";
export default class Merari extends EventEmitter<{
    starting: (bot: Merari) => void,
    loaded: (bot: Merari) => void,
    login: (bot: Merari, client: Client) => void
}>
{
    logger: Logger;
    client: Client;

    configManager: ConfigManager;
    commandManager: CommandManager;
    extensionManager: ExtensionManager;
    permissionsManager: PermissionsManager;
    clientManager: ClientManager;

    constructor(logger?: Logger)
    {
        super();

        this.logger = logger ?? new Logger();

        this.configManager = new ConfigManager(this, this.logger.child("CFGMGR"));
        this.commandManager = new CommandManager(this, this.logger.child("CMDMGR"));
        this.extensionManager = new ExtensionManager(this, this.logger.child("EXTMGR"));
        this.permissionsManager = new PermissionsManager(this, this.logger.child("PERMGR"));
        this.clientManager = new ClientManager(this, this.logger.child("CLIENTM"));

        this.client = this.clientManager.getClient();

        this.clientManager.on('login', () => {
            this.emit('login', this, this.client);
        })
    }

    async run(): Promise<void>
    {
        this.logger.greet(`Starting Merari bot v.${Version.get()} ...`);

        this.emit('starting', this);

        await this.configManager.run();
        await this.commandManager.run();
        await this.extensionManager.run();

        await this.clientManager.run();

        this.emit('loaded', this);
    }

}
