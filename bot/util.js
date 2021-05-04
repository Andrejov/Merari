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

/**
 * 
 * @param {Discord.Message} msg 
 */
util.spread = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;

    var chs = msg.guild.channels.cache.array().filter(c => c.type == 'voice').sort(() => 0.5 - Math.random());

    if(chs.length < 2)
    {
        await msg.channel.rtitled("Spread out failed",
            `This server does not have enough voice channels available to execute this command.`)
        return;
    }

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
        var i = 0;
        for(var m of vc.members.array())
        {
            var ci = i % chs.length;
            if(await m.voice.setChannel(chs[ci]))
            {
                n++;
            }
            i++;
        }
        await msg.channel.rtitled("Spread out successful",
            `Moved ${n}/${i} members to random channels`);
    }else{
        await msg.channel.rtitled("Spread out failed",
            `To use this command you have to join a voice channel or specify a channel as an argument.`)
    }
}

util.invite = async function(msg, vargs, gdoc, mdoc)
{
    if(!vargs.valid) return;

    await msg.channel.send({
        embed : {
            title : 'Click to invite Merari to your Discord server',
            url : require("../auth.json").discord.url,
            description : 'You can contact the author of this bot here: <@358231353898172417>',

            thumbnail : {
                url : cluster.bot.user.avatarURL()
            }
        }
    })
}

exports.register = function() {
    commands.registerCommand(["group", "groupup"], ["utext"], "MERARI_GROUP", util.group);
    commands.registerCommand(["spread", "spreadout"], ["utext"], "MERARI_GROUP", util.spread);

    commands.registerCommand(["merari", "inv", "invite", "help"], [], "", util.invite);
}