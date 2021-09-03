import { Client, Intents, Message } from "discord.js";
import moment from "moment";
import { EventEmitter } from "tsee";
import Merari from "../Merari";
import Command from "../Model/Command/Command";
import Config from "../Model/Config/Config";
import IManager from "../Model/Manager/IManager";
import Logger from "../Util/Logger";

export default class ClientManager extends EventEmitter<{
    login: () => void
}> implements IManager
{
    bot: Merari;
    logger: Logger;
    client: Client;
    auth: Config;

    commands: Command[] = [];

    private startTime: number;

    constructor(bot: Merari, logger: Logger)
    {
        super();

        this.bot = bot;
        this.logger = logger;
        this.auth = bot.configManager.authConfig;
        this.client = new Client({
            intents: [
                "GUILDS",
                "GUILD_MEMBERS",
                "GUILD_MESSAGES",
                "GUILD_WEBHOOKS",
                "GUILD_MESSAGE_REACTIONS",
                "GUILD_INVITES"
            ]
        })

        this.startTime = new Date().getTime();
    }

    getClient()
    {
        return this.client;
    }

    getUptime(): string
    {
        return moment(this.startTime).fromNow(true);
    }
    
    async run() {
        this.logger.msg(this).starting();

        this.client.on('ready', () => {
            this.logger.greet("Bot logged in successfully");
            this.client.user?.setActivity({
                type: 'STREAMING',
                name: 'booting...',
                url: 'https://youtube.com/'
            })

            this.emit('login');
        });

        this.client.on('messageCreate', async (msg) => {
            try {
                await this.bot.commandManager.handleMessage(msg);
            } catch (error) {
                this.logger.err("Caught error while handling message. " + error);
            }
        })

        try {
            await this.client.login(
                this.auth.getString("token")
            )
        } catch (error) {
            this.logger.err("Could not log in with specified token: Verify token key in ./config/auth.json");
        }
    }
}