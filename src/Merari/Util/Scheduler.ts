import Merari from "../Merari";
import Extension from "../Model/Extension/Extension";
import Logger from "./Logger";

export default class Scheduler
{
    logger: Logger;

    events: ScheduledEvent[] = [];
    
    constructor(logger: Logger)
    {
        this.logger = logger;
    }

    scheduleRepeatingTask(extension: Extension, callback: () => void | Promise<void>, time: number)
    {
        this.events.push(
            new ScheduledEvent(extension, callback, time, false)
        )
    }

    scheduleDelayedTask(extension: Extension, callback: () => void | Promise<void>, time: number)
    {
        this.events.push(
            new ScheduledEvent(extension, callback, time, true)
        )
    }

    clearOne(e: ScheduledEvent)
    {
        this.clearBy(x => e === x);
    }

    clearBy(filter: (e: ScheduledEvent) => boolean)
    {
        this.events = this.events.map(e => {
            if(filter(e))
            {
                e.clear()
            } else {
                return e;
            }
        }).filter(e => e != undefined) as ScheduledEvent[];
    }

    clearFired()
    {
        this.clearBy(e => e.timeoutFired);
    }

    clearExtension(extension: Extension)
    {
        this.clearBy(e => e.extension == extension);
    }

    clearAll()
    {
        this.clearBy(e => true);
    }
}

export class ScheduledEvent
{
    extension: Extension;
    time: number;
    isTimeout?: boolean;
    callback: () => void | Promise<void>;

    address?: NodeJS.Timeout | NodeJS.Timer;
    timeoutFired: boolean = false;

    constructor(extension: Extension, callback: () => void | Promise<void>, time: number, fireOnlyOnce?: boolean)
    {
        this.extension = extension;
        this.isTimeout = fireOnlyOnce;
        this.callback = callback;
        this.time = time;
    }

    schedule()
    {
        if(this.address)
        {
            this.clear();
        }

        if(this.isTimeout)
        {
            this.address = setTimeout(() => {
                this.timeoutFired = true;
                this.callback();
            }, this.time);
        } else {
            this.address = setInterval(() => {
                this.callback();
            }, this.time);
        }
    }

    clear()
    {
        if(!this.address) return;

        if(this.isTimeout)
        {
            clearTimeout(this.address);
        } else {
            clearInterval(this.address);
        }
        
        this.timeoutFired = false;
        this.address = undefined;
    }
}