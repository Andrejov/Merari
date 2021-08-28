import ExtensionManager from "../../Core/ExtensionManager";
import Scheduler from "../../Util/Scheduler";

export default class ExtensionShell
{
    private manager: ExtensionManager

    constructor(manager: ExtensionManager)
    {
        this.manager = manager;
    }

    getScheduler(): Scheduler
    {
        return this.manager.scheduler;
    }
}