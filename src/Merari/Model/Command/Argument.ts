import { User, GuildMember, TextBasedChannels, VoiceBasedChannelTypes, Channel, Guild, Collection, GuildChannel, ThreadChannel } from "discord.js";
import Command from "./Command";


export default class Argument
{
    static async parse(guild: Guild, str: string, {type, optional}: ArgumentType): Promise<{
        value: ArgumentValue,
        present: boolean,
        valid: boolean,
        msg?: string
    }> {
        let value: ArgumentValue | undefined = 0;
        let present = false;
        let valid = true;
        let msg = "";

        if(type == "text")
        {
            value = str;
            present = true;
        } else if(type == "number")
        {
            const nan = +str;

            if(isNaN(nan))
            {
                valid = false;
                msg = "Cannot parse argument to number"
            } else {
                value = nan;
                present = true;
            }
        } else if(type == "member") {
            const find = str.toLowerCase().trim();
            const finds = find.split(' ');

            let member: GuildMember | undefined;

            // Search by mention
            if(find.startsWith("<@"))
            {
                let mention = find.substr(2, find.length - 3);

                if(mention.startsWith("!")) mention = mention.substr(1);

                member = member ?? guild.members.cache.find(m => !!(m.user.id == mention));
            }

            // Fetch members when in doubt
            if(!member)
            {
                await guild.members.fetch();
            }

            // Search by nickname
            member = member ?? guild.members.cache.find(m => !!(m.nickname && (m.nickname.trim().toLowerCase() == find)));
            member = member ?? guild.members.cache.find(m => !!(m.nickname && finds.find(p => (m.nickname + "").toLowerCase().indexOf(p) > -1)));
            
            // Search by username
            member = member ?? guild.members.cache.find(m => !!(m.user.username.trim().toLowerCase() == find));
            member = member ?? guild.members.cache.find(m => !!(finds.find(p => m.user.username.toLowerCase().indexOf(p) > -1)));

            // Search by tag
            member = member ?? guild.members.cache.find(m => !!(m.user.tag.trim().toLowerCase() == find));
            member = member ?? guild.members.cache.find(m => !!(finds.find(p => m.user.tag.toLowerCase().indexOf(p) > -1)));

            // Search by id
            member = member ?? guild.members.cache.find(m => !!(m.user.id.trim().toLowerCase() == find));

            if(member)
            {
                value = member;
                present = true;
            } else {
                valid = false;
                msg = "Could not find that member";
            }
        } else if(type == 'user') {
            const find = str.toLowerCase().trim();
            const finds = find.split(' ');

            let user: User | undefined;

            // Search by mention
            if(find.startsWith("<@"))
            {
                let mention = find.substr(2, find.length - 3);

                if(mention.startsWith("!")) mention = mention.substr(1);

                user = user ?? guild.client.users.cache.find(m => !!(m.id == mention));
                try {
                    user = user ?? await guild.client.users.fetch(mention);
                } catch (error) {}
            }

            // Fetch members when in doubt
            if(!user)
            {
                await guild.members.fetch();
            }
            
            // Search by username
            user = user ?? guild.client.users.cache.find(m => !!(m.username.trim().toLowerCase() == find));
            user = user ?? guild.client.users.cache.find(m => !!(finds.find(p => m.username.toLowerCase().indexOf(p) > -1)));

            // Search by tag
            user = user ?? guild.client.users.cache.find(m => !!(m.tag.trim().toLowerCase() == find));
            user = user ?? guild.client.users.cache.find(m => !!(finds.find(p => m.tag.toLowerCase().indexOf(p) > -1)));

            // Search by id
            user = user ?? guild.client.users.cache.find(m => !!(m.id.trim().toLowerCase() == find));

            // Final touch
            try {
                user = user ?? await guild.client.users.fetch(find);
            } catch (error) {}

            if(user)
            {
                value = user;
                present = true;
            } else {
                valid = false;
                msg = "Could not find that user";
            }
        } else if(type == 'channel' || type == 'tchannel' || type == 'vchannel')
        {
            const find = str.toLowerCase().trim();
            const finds = find.split(' ');

            let channels: Collection<string, ThreadChannel | GuildChannel> = new Collection();

            if(type == 'channel')
            {
                channels = guild.channels.cache.filter(c => true);
            } else if(type == 'vchannel')
            {
                channels = guild.channels.cache.filter(c => c.type == 'GUILD_VOICE' || c.type == 'GUILD_STAGE_VOICE');
            } else if(type == 'tchannel')
            {
                channels = guild.channels.cache.filter(c => c.type == 'GUILD_TEXT');
            }

            let channel: Channel | undefined;

            // Search by name
            channel = channel ?? channels.find(c => !!(c.name.trim().toLowerCase() == find));
            channel = channel ?? channels.find(c => !!(finds.find(p => c.name.toLowerCase().indexOf(p) > -1)));

            // Search by id
            channel = channel ?? channels.find(c => !!(c.id.trim().toLowerCase() == find));

            if(channel)
            {
                value = channel;
                present = true;
            } else {
                valid = false;
                msg = "Could not find that channel";
            }
        }

        if(optional)
        {
            valid = true;
        } else {
            if(valid && !present)
            {
                valid = present;
                msg = "Argument not present"
            }
        }

        return {
            value,
            present,
            valid,
            msg
        };
    }

    static usageMessage(prefix: string, cmd: string, {structure}: ArgumentStructure, badArg: number): string
    {
        return `*${prefix}${cmd}* ` + 
            structure.map(a => a.optional ? `[${a.type}]` : `<${a.type}>`)
            .map((a,i) => i == badArg ? `**${a}**` : a).join(' ');
    }
    static usagesMessage(prefix: string, cmd: Command): string[]
    {
        return [
            '```',
            `Possible syntax for command ${cmd.aliases[0]}`,
            `Aliases: ${cmd.aliases.join(' | ')}`,
            ...cmd.args.map(s => 
                `${prefix}${cmd.aliases[0]} ` +
                s.structure.map(a => a.optional ? `[${a.type}]` : `<${a.type}>`).join(' ')
            ),
            '```'
        ]
    }
}

export type ArgumentTypeBase = 'text' | 'number' | 
                               'user' | 'member' |
                               'channel' | 'tchannel' | 'vchannel';
// export type ArgumentType = ArgumentTypeBase | `o${ArgumentTypeBase}`;
// export type ArgumentStructure = ArgumentType[];

// export type ArgumentValue = string | number |
//                             User | GuildMember |
//                             Channel | TextChannel | VoiceChannel |
//                             undefined;

// export class ArgumentType<T extends ArgumentValue>
// {
//     type: new () => T;
//     optional: boolean = false;

//     constructor(t: new () => T, optional?: boolean)
//     {
//         this.type = t;
//         this.optional = optional ?? false;
//     }
// }

export type ArgumentValue = string | number |
                            User | GuildMember |
                            Channel | TextBasedChannels | VoiceBasedChannelTypes;
export class ArgumentType
{
    type: ArgumentTypeBase;
    optional: boolean = false;

    constructor(type: ArgumentTypeBase, optional?: boolean)
    {
        this.type = type;
        this.optional = optional ?? false;
    }
}

export class ArgumentStructure
{
    name: string;
    structure: ArgumentType[];

    constructor(name: string, structure: ArgumentType[])
    {
        this.name = name;
        this.structure = structure;
    }

    static make(name: string, ...structure: (ArgumentType | ArgumentTypeBase | { type: ArgumentTypeBase, optional?: boolean })[])
    {
        return new ArgumentStructure(
            name, 
            structure.map(a => {
                if(a instanceof ArgumentType)
                {
                    return a;
                } else if(typeof a === 'string') {
                    return new ArgumentType(a);
                } else {
                    return new ArgumentType(a.type, a.optional);
                }
            })
        );
    }

    minLength(): number
    {
        return this.structure.filter(a => !a.optional).length;
    }
    maxLength(): number
    {
        return this.structure.length;
    }
    lastText(): boolean
    {
        return this.structure[this.structure.length - 1].type == "text";
    }
}