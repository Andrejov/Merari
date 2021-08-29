import { Client, Intents, Message } from "discord.js";
import Merari from "../Merari";
import Command from "../Model/Command/Command";
import Config from "../Model/Config/Config";
import IManager from "../Model/Manager/IManager";
import Logger from "../Util/Logger";

export default class ClientManager implements IManager
{
    bot: Merari;
    logger: Logger;
    client: Client;
    auth: Config;

    commands: Command[] = [];

    constructor(bot: Merari, logger: Logger)
    {
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
    }

    getClient()
    {
        return this.client;
    }
    
    async run() {
        this.logger.msg(this).starting();

        this.client.on('ready', () => {
            this.logger.greet("Bot logged in successfully");
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