import { Message, TextBasedChannels, TextBasedChannelFields, TextChannel, NewsChannel } from "discord.js";

export default class Util
{
    static async embed(
        channel: TextBasedChannels | Message,
        title: string,
        text: string | string[]
    ) {
        if(channel instanceof Message)
        {
            channel = channel.channel;
        }

        return await channel.send({
            embeds: [
                {
                    color: 0xaa00aa,
                    title: title,
                    description: (Array.isArray(text) ? text.join("\r\n") : text).trim()
                }
            ]
        })
    }

    static async getWebhook(channel: TextChannel | NewsChannel)
    {
        const hooks = await channel.fetchWebhooks();
        const bot = channel.client.user;

        let hook = hooks.find(w => w.channelId == channel.id && w.owner == bot);

        if(!hook)
        {
            hook = await channel.createWebhook('Merari');
        }

        return hook;
    }
}