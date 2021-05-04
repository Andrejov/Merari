const Discord = require("discord.js");
const cluster = require("../cluster")
const db = require("../db");
const commands = require("./commands")

var admin = {};
admin.ping = async function(msg, vargs, gdoc, mdoc) {
    if(!vargs.valid) return;

    await msg.channel.rtitled("Pong",
        `Real-time: ${Date.now() - msg.createdTimestamp} ms\n` + 
        `WS: ${cluster.bot.ws.ping} ms\n` + 
        `Current cluster: ${cluster.clusterId}`);
}

admin.clusters = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;

    var c = await db.clusterss();
    var s = c.map(a => {
        return `Cluster #${a.id} - ${a.guilds.length}g ${a.channels.length}c ` +
               `(${a.modes.indexOf("guild")>-1 ? "G" : "g"}${a.modes.indexOf("channel")>-1 ? "C" : "c"})` +
               `; last active: ${new Date(a.lastPoll).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`;
    })
 
    await msg.channel.rtitled("Clusters dump",
        `Current clusters saved in the data base:\n${s.join('\n')}`);
}

admin.clusterSet = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;
}

admin.setPerms = async function(msg, vargs, gdoc, mdoc) {
    if(!vargs.valid) return;

    var nperms = vargs.values[1].trim().toUpperCase().split(' ');

    await db.members.updateOne({id : `${msg.guild.id}-${vargs.values[0].id}`},
    {
        $set : {
            permissions : nperms
        }
    })

    await msg.channel.rtitled("Permission operation successful",
        `User '${vargs.values[0].tag}' has now ${nperms.length} permissions.`);
}

admin.viewPerms = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;

    var m = msg.author;

    if(vargs.values[0])
    {
        m = vargs.values[0];
    }

    var doc = await db.member2(msg.guild.id, m.id);

    var perms = doc.permissions.join('; ')

    await msg.channel.rtitled("Member's private permissions",
        `Array: [${perms}]`)
}

admin.grantPerm = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;

    var target = vargs.values[0];
    var pname = vargs.values[1].toUpperCase();

    if(!pname.startsWith("MERARI_"))
    {
        await msg.channel.rtitled("Grant permission failed",
            `This command can only modify MERARI permissions.`)
        return;
    }

    var hp = await commands.hasPermission(pname, msg.member, gdoc, mdoc)

    if(!hp)
    {
        await msg.channel.rtitled("Grant permission failed",
            `In order to grant this permission to another member, you need to have it first.`);
        return;
    }

    var tdoc = await db.member2(msg.guild.id, target.id);

    if(tdoc.permissions && tdoc.permissions.indexOf(pname) > -1)
    {
        await msg.channel.rtitled("Grant permission cancelled",
            `This member already has this permission.`);
        return;
    }

    var nperms = tdoc.permissions ? tdoc.permissions : [];

    nperms.push(pname);

    if(nperms.length > 16)
    {
        await msg.channel.rtitled("Grant permission cancelled",
            `This member has reached the maximum of ${nperms.length - 1} permissions per user.`);
        return;
    }

    await db.members.updateOne({id : `${msg.guild.id}-${target.id}`},
    {
        $set : {
            permissions : nperms
        }
    })

    await msg.channel.rtitled("Grant permission successful",
        `You have successfully granted '${target.tag}' the *${pname}* permission (total: ${nperms.length}).`);

}

exports.register = function() {
    commands.registerCommand("ping", [], "MERARI_PING", admin.ping)

    commands.registerCommand(["setperms", "sperms"], ["mention", "text"], "MANAGER", admin.setPerms);
    commands.registerCommand(["cluster", "clusters"], [], "MANAGER", admin.clusters);

    commands.registerCommand(["viewperms", "vperms"], ["umention"], "MERARI_ADMINISTRATOR", admin.viewPerms);
    commands.registerCommand(["grantperms", "gperms"], ["mention", "word"], "", admin.grantPerm);
}