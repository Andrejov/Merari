import Merari from "../Merari";
import Config from "../Model/Config/Config";
import IManager from "../Model/Manager/IManager";
import Directory from "../Util/Directory";
import Logger from "../Util/Logger";

export default class ConfigManager implements IManager
{
    bot: Merari;
    logger: Logger;

    mainConfig: Config;
    authConfig: Config;
    commandConfig: Config;

    constructor(bot: Merari, logger?: Logger)
    {
        this.bot = bot;
        this.logger = logger ?? bot.logger;

        this.mainConfig = new Config(
            this.logger.child("Main"),
            Directory.getConfig("config.json"),
            'main'
        )
        this.authConfig = new Config(
            this.logger.child("Auth"),
            Directory.getConfig("auth.json"),
            'auth'
        )
        this.commandConfig = new Config(
            this.logger.child("Cmd"),
            Directory.getConfig("command.json"),
            'auth'
        )
    }

    async run()
    {
        this.logger.msg(this).starting();

        this.logger.trace(`Loading configs at ${Directory.getConfig()}`);
        this.mainConfig.init({
            development: false,
            owners: []
        })
        this.authConfig.init({
            token: ""
        })
        this.commandConfig.init({
            prefix: "$"
        })
    }
}