import { ActivityType } from "discord.js";
import Extension from "../Merari/Model/Extension/Extension";

export default class ActivityExtension extends Extension
{

    public type?: ActivityType; // = "STREAMING";
    public url?: string; // = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    public name?: string; // = "Loading...";

    private lastStatus: {
        type?: ActivityType,
        url?: string,
        name?: string
    } = {};

    async enable()
    {
        this.config.init({
            type: "PLAYING",
            url: "",
            name: "ping pong"
        })

        this.type = this.config.getString("type") as ActivityType;
        this.url = this.config.getString("url");
        this.name = this.config.getString("name");

        this.shell.scheduleRepeatingTask(this.tick, 1000).schedule();
    }

    async tick()
    {
        const status = {
            type: this.type,
            url: this.url,
            name: this.name
        }

        const compare = JSON.stringify(this.lastStatus) === JSON.stringify(status);

        if(!compare)
        {
            this.logger.info(`Activity status has changed - updating`)
            this.lastStatus = status;

            await this.bot.client.user?.setActivity({ 
                type: status.type,
                name: status.name,
                url: status.url
            })
        }
    }
}