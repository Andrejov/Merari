const Discord = require("discord.js")
const cluster = require("../cluster")
const db = require("../db");
const auth = require("../auth.json")

const vargs = require("./vargs")
const rich = require("./rich")

/**
 * @type {Object<string,CommandStruct>}
 */
exports.commands = {};

/**
 * @enum {string}
 */
exports.arg = {
    word : 'word',
    mention : 'mention',
    unumber : 'unumber',
    wnumber : 'wnumber',
    decimal : 'decimal',
    text : 'text'
}
/**
 * @typedef {Array<exports.arg>} ArgStruct
 */

 /**
  * @typedef {Object} CommandStruct
  * @property {ArgStruct} args
  * @property {function} execute
  * @property {string} permission
  */

exports.registerCommand = function(cmd, argstr, perms, func)
{
    var o = {
        args : argstr,
        execute : func,
        permission : perms
    }
    if(Array.isArray(cmd))
    {
        cmd.forEach(c => {
            exports.commands[c.toLowerCase()] = o;
        })
    }else{
        exports.commands[cmd.toLowerCase()] = o;
    }
}

/**
 * 
 * @param {string} permname 
 * @param {Discord.GuildMember} member 
 * @param {*} gdoc 
 * @param {*} mdoc 
 */
exports.hasPermission = async function(permname, member, gdoc, mdoc) {
    if(!permname) return true;
    if(permname == "UNOBTAINABLE") return false;

    if(permname == "MANAGER")
    {
        return auth.discord.managers.indexOf(member.user.id) > -1;
    }

    if(!gdoc)
    {
        gdoc = await db.guild(member.guild.id);
    }
    if(!mdoc)
    {
        mdoc = await db.member2(member.guild.id,member.user.id);
    }

    if(permname.startsWith("MERARI_"))
    {
        if(gdoc.permissions)
        {
            if(gdoc.permissions.indexOf(permname) > -1)
            {
                return true;
            }
        }
        if(mdoc.permissions)
        {
            if(mdoc.permissions.indexOf(permname) > -1)
            {
                return true;
            }
            // }else if(mdoc.permissions.indexOf("MERARI_ADMINISTRATOR") > -1){
            //     return true;
            // }
        }

        return member.hasPermission("ADMINISTRATOR");
        // if(permname == "MERARI_ADMINISTRATOR")
        // {
        //     return member.hasPermission("ADMINISTRATOR");
        // }
        // return false;
    }

    return member.hasPermission(permname);
}

/**
 * 
 * @param {Discord.Message} msg 
 */
exports.handleMessage = async function(msg)
{
    if(msg.author.bot) return false;

    var gdoc = await db.guild(msg.guild.id);

    var prefix = gdoc.prefix ? gdoc.prefix : '$';

    var content = msg.content.trim();

    if(content.startsWith(prefix))
    {
        var cmd = content.split(' ')[0].substr(1).toLowerCase();

        if(exports.commands[cmd])
        {
            var mdoc = await db.member2(msg.guild.id, msg.member.id);

            var command = exports.commands[cmd];

            var hasPerm = false;

            if(Array.isArray(command.permission))
            {
                for(var pname of command.permission)
                {
                    hasPerm = await exports.hasPermission(pname,msg.member,gdoc,mdoc)
                    if(hasPerm) break;
                }
            }else{
                var pname = command.permission;
                hasPerm = await exports.hasPermission(pname,msg.member,gdoc,mdoc)
            }


            var perms = hasPerm ? false : pname;

            var v = await vargs.v(msg, command.args, perms, cmd);
        
            var err = 0;

            try {
                err = await command.execute(msg, v, gdoc, mdoc);
            } catch (error) {
                err = error;
            }

            if(err)
            {
                await msg.channel.rtitled("Command data return",
                    `The latest command execution has returned a non-zero value '${err}'.`);
            }
        }else{
            await msg.channel.rtitled("Unknown command/alias", 
                `This bot has replied, because you have used the prefix ${prefix}.`);
        }
    }
}

exports.register = async function()
{
    require("./admin").register();
    require("./fun").register();
    require("./util").register();

    console.log(` CMD: Registered ${Object.keys(exports.commands).length} commands w/ aliases`)
}