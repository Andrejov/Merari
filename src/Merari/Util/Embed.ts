import { Message, TextBasedChannels, TextBasedChannelFields } from "discord.js";

export default class Embed
{
    static async send(
        channel: TextBasedChannels | Message,
        title: string,
        text: string | string[]
    ) {
        if(channel instanceof Message)
        {
            channel = channel.channel;
        }

        await channel.send({
            embeds: [
                {
                    color: 0xaa00aa,
                    title: title,
                    description: (Array.isArray(text) ? text.join("\r\n") : text).trim()
                }
            ]
        })
    }
}