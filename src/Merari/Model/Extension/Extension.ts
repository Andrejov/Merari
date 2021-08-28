import Merari from "../../Merari";
import Directory from "../../Util/Directory";
import Logger from "../../Util/Logger";
import Config from "../Config/Config";
import ExtensionShell from "./ExtensionShell";

export default abstract class Extension
{
    bot: Merari
    logger: Logger
    shell: ExtensionShell;

    config: Config;

    constructor(bot: Merari, logger: Logger, shell: ExtensionShell)
    {
        this.bot = bot;
        this.logger = logger;
        this.shell = shell;

        this.config = new Config(
            logger.child("Config"),
            Directory.getConfig(`extension_${this.getName()}.json`)
        );

        this.create();
    }

    getNames(): {
        full: string,
        short: string
    } {
        return {
            full: this.getName(),
            short: this.getNameShort()
        };
    }

    getName(): string {
        return this.constructor.name
    }

    getNameShort(): string {
        return this.constructor.name.split('').filter(c => c.toUpperCase() == c).join('')
    }

    create(): void 
    {}
    async enable(): Promise<void>
    {}
    async disable(): Promise<void>
    {}

}