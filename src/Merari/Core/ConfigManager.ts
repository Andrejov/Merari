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
    developmentConfig: Config;

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
            'command'
        )
        this.developmentConfig = new Config(
            this.logger.child("development"),
            Directory.getConfig("development.json"),
            'development'
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

        if(this.mainConfig.getBool('development'))
        {
            this.developmentConfig.init({});

            let overriden = 0;

            const keys = Object.keys(this.developmentConfig.map);

            keys.forEach(key => {
                const section = this.developmentConfig.getSection(key);

                const sk = Object.keys(section.map);
                
                sk.forEach(k => {
                    process.env[`CFG_${key.toUpperCase()}_${k.toUpperCase()}`] = JSON.stringify(section.get(k));

                    overriden += 1;
                })
            })

            this.logger.debug(`Loaded development config with ${overriden} keys overriden`);
        }
    }
}