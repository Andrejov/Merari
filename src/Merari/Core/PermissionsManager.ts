import { GuildMember, PermissionString } from "discord.js";
import Merari from "../Merari";
import Command from "../Model/Command/Command";
import { MerariPermission, Permission } from "../Model/Command/Permissions";
import IManager from "../Model/Manager/IManager";
import Logger from "../Util/Logger";

export default class PermissionsManager implements IManager
{
    bot: Merari;
    logger: Logger;

    commands: Command[] = [];

    constructor(bot: Merari, logger: Logger)
    {
        this.bot = bot;
        this.logger = logger;
    }

    async run()
    {
        this.logger.msg(this).starting();
    }

    owners(): string[]
    {
        return this.bot.configManager.mainConfig.getList<string>('owners').map(e => `${e}`);
    }

    async hasPermission(member: GuildMember, perm?: Permission): Promise<boolean>
    {
        if(!perm)
        {
            return true;
        }

        if(perm == 'ANY')
        {
            return true;
        } else if(perm.startsWith('MERARI_'))
        {
            let permission = perm as MerariPermission;

            if(permission == 'MERARI_ADMIN')
            {
                return member.permissions.has('ADMINISTRATOR') ||
                    this.hasPermission(member, 'MERARI_OWNER');
            } else if(permission == 'MERARI_OWNER')
            {
                const owners = this.owners();
                return owners.indexOf(member.user.id) > -1;
            } else {
                return await this.hasPermission(member, 'MERARI_ADMIN');
            }
        } else {
            let permission = perm as PermissionString;

            return member.permissions.has(permission as PermissionString, true);
        }
    }
} 