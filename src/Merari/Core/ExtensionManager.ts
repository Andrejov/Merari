import Merari from "../Merari";
import Extension from "../Model/Extension/Extension";
import ExtensionShell from "../Model/Extension/ExtensionShell";
import IManager from "../Model/Manager/IManager";
import Logger from "../Util/Logger";
import Scheduler from "../Util/Scheduler";

export default class ExtensionManager implements IManager
{
    bot: Merari;
    logger: Logger;

    extensions: Extension[] = [];
    shell: ExtensionShell;
    scheduler: Scheduler;

    constructor(bot: Merari, logger: Logger)
    {
        this.bot = bot;
        this.logger = logger;
        this.shell = new ExtensionShell(this);
        this.scheduler = new Scheduler(this.logger.child("SCHDL"));
    }

    async run()
    {
        this.logger.msg(this).starting();
    }
}