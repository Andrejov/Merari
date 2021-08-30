import { StageChannel, ThreadMemberManager, VoiceBasedChannelTypes, VoiceChannel } from "discord.js";
import { ArgumentStructure } from "../Merari/Model/Command/Argument";
import Response from "../Merari/Model/Command/Response";
import Extension from "../Merari/Model/Extension/Extension";
import Util from "../Merari/Util/Util";

export default class UtilityExtension extends Extension
{
    async enable()
    {
        this.shell.register(
            ['group', 'groupup', 'move', 'moveall'], 
                [
                ArgumentStructure.make('empty'),
                ArgumentStructure.make('channel', 'vchannel')
            ],
            async ctx => {
                let destination: VoiceChannel | undefined;

                if(ctx.argStruct.name == 'channel')
                {
                    destination = ctx.args[0] as VoiceChannel;
                } else {
                    if(ctx.member?.voice && 
                        ctx.member.voice.channel && 
                        ctx.member.voice.channel instanceof VoiceChannel)
                    {
                        destination = ctx.member.voice.channel;
                    } else {
                        return Response.bad([
                            'You must be connected to a voice channel or specify one',
                            '```',
                            `${this.bot.commandManager.getPrefix()}${ctx.alias} <vchannel>`,
                            '```'
                        ])
                    }
                }

                let channels = 0;
                let members = 0;
                let errors = 0;

                await Promise.all(
                    ctx.guild?.channels.cache
                        .filter(c => c.isVoice())
                        .map(async c => {
                            let current = 0;

                            await Promise.all(
                                (c.members instanceof ThreadMemberManager ?
                                    c.members.cache.map(mbr => mbr.guildMember?.voice.setChannel(destination ?? null)) :
                                    c.members.map(mbr => mbr.voice.setChannel(destination ?? null)))
                                .map(pm => pm?.then(() => current++).catch(() => errors++))
                            )

                            members += current;

                            return current;
                        }).map(pc => {
                            return pc.then((count) => channels += +!!(count)).catch(() => errors++);
                        }
                    ) ?? []
                )
                
                await Util.embed(ctx.message, 'Group up', [
                    `Moved **${
                        members
                    } members** from **${
                        channels
                    } channels** into \`${
                        destination.name
                    }\` with **${
                        errors
                    } errors**`
                ])

                return Response.ok();
            }
        )
    }
}