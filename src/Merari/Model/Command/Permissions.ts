import { PermissionString } from "discord.js";

export type Permission = MerariPermission | PermissionString;

export type MerariPermission = 'MERARI_OWNER' | 'MERARI_ADMIN' | 'ANY';