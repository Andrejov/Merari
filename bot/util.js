const Discord = require("discord.js");
const cluster = require("../cluster")
const db = require("../db");
const commands = require("./commands")

var util = {};

/**
 * 
 * @param {Discord.Message} msg 
 * @param {*} vargs 
 * @param {*} gdoc 
 * @param {*} mdoc 
 */
util.group = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;

    var vc = msg.member.voice.channel;

    if(vargs.values[0])
    {
        var chn = vargs.values[0].toString().toLowerCase().trim();

        msg.guild.channels.cache.every(ch => {
            if(ch.type == 'voice' && ch.name.toLowerCase().trim() == chn)
            {
                vc = ch;
                return false;
            }
            return true;
        })
    }

    if(vc)
    {
        var n = 0;
        for(var ch of msg.guild.channels.cache.array())
        {
            if(ch.type == 'voice')
            {
                for(var m of ch.members.array())
                {
                    if(await m.voice.setChannel(vc))
                    {
                        n++;
                    }
                }
            }
        }
        msg.channel.rtitled("Group up successful",
            `Moved ${n} members to channel ${vc.name}`);
    }else{
        msg.channel.rtitled("Group up failed",
            `To use this command you have to join a voice channel or specify a channel as an argument.`)
    }
}

exports.register = function() {
    commands.registerCommand(["group", "groupup"], ["utext"], "MERARI_GROUP", util.group);
}