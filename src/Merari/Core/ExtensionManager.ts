import Merari from "../Merari";
import Extension from "../Model/Extension/Extension";
import ExtensionShell, { ExtensionShellLoader } from "../Model/Extension/ExtensionShell";
import IManager from "../Model/Manager/IManager";
import Logger from "../Util/Logger";
import Scheduler from "../Util/Scheduler";

export default class ExtensionManager implements IManager
{
    bot: Merari;
    logger: Logger;

    extensions: Extension[] = [];
    enabled: Extension[] = [];
    // shell: ExtensionShell;
    scheduler: Scheduler;

    constructor(bot: Merari, logger: Logger)
    {
        this.bot = bot;
        this.logger = logger;
        // this.shell = new ExtensionShell(this);
        this.scheduler = new Scheduler(this.logger.child("SCHDL"));
    }

    async run()
    {
        this.logger.msg(this).starting();

        await this.enable();
        // for(let ext of this.extensions)
        // {
        //     this.logger.debug(`Enabling ${ext.getName()}...`)
        //     await ext.enable();
        // }
    }

    filterExtensions(match?: ((ext: Extension) => boolean) | Extension | Extension[]): (ext: Extension) => boolean
    {
        let filter: ((ext: Extension) => boolean) | undefined;

        if(Array.isArray(match))
        {
            filter = ext => match.indexOf(ext) != -1
        } else if(match instanceof Extension) {
            filter = ext => match === ext;
        } else if(match) {
            filter = match;
        } else {
            filter = () => true;
        }
        
        return filter;
    }

    async enable(match?: ((ext: Extension) => boolean) | Extension | Extension[])
    {
        const filter = this.filterExtensions(match);

        for(let ext of this.extensions.filter(e => this.enabled.indexOf(e) == -1).filter(filter))
        {
            this.logger.debug(`Enabling ${ext.getName()}...`)

            try {
                await ext.enable();
                this.enabled.push(ext);
            } catch (error) {
                this.logger.err(`Error while enabling ${ext.getName()}. ${error}`);
            }
        }
    }

    async disable(match?: ((ext: Extension) => boolean) | Extension | Extension[])
    {
        const filter = this.filterExtensions(match);

        for(let ext of this.extensions.filter(e => this.enabled.indexOf(e) != -1).filter(filter))
        {
            this.logger.debug(`Disabling ${ext.getName()}...`)

            try {
                this.scheduler.clearExtension(ext);
                this.bot.commandManager.unregister(ext);

                this.enabled = this.enabled.filter(e => e != ext);
                await ext.disable();
            } catch (error) {
                this.logger.err(`Error while disabling ${ext.getName()}. ${error}`);
            }
        }
    }

    get<T extends Extension>(ext: new () => T): T
    {
        return this.extensions.find(e => e.constructor.name == ext.name) as T;
    }

    push(ext: Extension): Extension
    {
        this.extensions.push(ext);
        return ext;
    }

    add(ext: new (bot: Merari, logger: Logger, shell: ExtensionShell) => Extension): Extension
    {
        const esl = new ExtensionShellLoader();
        const e = new ext(this.bot, this.logger, new ExtensionShell(this, esl));
        esl.extension = e;

        e.logger = this.logger.child(e.getNameShort());

        this.push(e);
        return e;
    }
}