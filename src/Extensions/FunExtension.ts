import { TextChannel, User } from "discord.js";
import { ArgumentStructure } from "../Merari/Model/Command/Argument";
import Response from "../Merari/Model/Command/Response";
import Extension from "../Merari/Model/Extension/Extension";
import Util from "../Merari/Util/Util";

export default class FunExtension extends Extension
{
    async enable()
    {
        this.shell.register(
            ['fake', 'fk'], 
            ArgumentStructure.make('main', 'user', 'text'),
            async ctx => {
                const wh = await Util.getWebhook(ctx.channel as TextChannel);

                const user = ctx.args[0] as User;
                const member = ctx.guild?.members.cache.get(user.id);

                let username = user.username;

                if(member && member.nickname)
                {
                    username = member.nickname;
                }

                await wh.send({
                    username,
                    content: ctx.args[1] as string,
                    avatarURL: user.avatarURL() ?? undefined
                });

                return Response.delete();
            },
            'MERARI_ADMIN'
        )

        this.shell.register(
            ['pop', 'foil'],
            [],
            async ctx => {
                await Util.embed(ctx.message, 'Pop me :3', [
                    ...new Array(8).fill(`|| O ||`.repeat(15)) as string[]
                ])

                return Response.ok();
            },
            'ANY'
        )
    }
}