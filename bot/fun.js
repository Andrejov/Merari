const Discord = require("discord.js");
const cluster = require("../cluster")
const db = require("../db");
const commands = require("./commands")

var fun = {};

/**
 * 
 * @param {Discord.TextChannel} channel 
 */
async function getWebhook(channel)
{
    var whs = await channel.fetchWebhooks();

    var wh = whs.find(w => w.channelID == channel.id);

    if(!wh)
    {
        wh = await channel.createWebhook('Merari');
    }

    return wh;
}

fun.fake = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;

    var u = vargs.values[0];
    var m = msg.guild.member(u);

    var wh = await getWebhook(msg.channel);
    

    await msg.delete();
    await wh.send(vargs.values[1].trim(), {
        username : (m ? m.nickname : null) || u.username,
        avatarURL : u.avatarURL()
    })
}



exports.register = function() {
    commands.registerCommand(["fake", "fk"], ["mention", "text"], "MERARI_FAKE", fun.fake);
}