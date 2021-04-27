const Discord = require("discord.js");

const cluster = require("./cluster");
const db = require("./db")

exports.guilds = [];
exports.channels = [];
exports.modes = [];

exports.loadSub = async function()
{
    var cid = cluster.clusterId;

    var doc = await db.cluster(cid);

    if(!doc)
    {
        if(cid != 0)
        {
            console.log(" SUB: This cluster has not been set up yet; terminating.")
            return false;
        }else{
            console.log(" SUB: Creating nonexistent cluster 0 doc;")
            doc = {
                id : 0,
                guilds : [],
                channels : [],
                modes : []
            }
            await db.clusters.insertOne(doc);
        }
    }

    if(Array.isArray(doc.guilds)) { exports.guilds = doc.guilds; }
    if(Array.isArray(doc.channels)) { exports.channels = doc.channels; }
    if(Array.isArray(doc.modes)) { exports.modes = doc.modes; }

    console.log(` SUB: Loaded cluster ${cid} doc; ${exports.guilds.length}G ${exports.channels.length}C`);

    return exports;
}

/**
 * @param {Discord.Guild} guild
 * @param {Discord.Channel} channel 
 */
exports.handle = function(guild,channel)
{
    if(exports.modes.indexOf("guild")>-1)
    {
        if(exports.guilds.indexOf(guild.id) == -1)
        {
            return false;
        }
    }

    if(exports.modes.indexOf("channel") > -1)
    {
        if(channel)
        {
            if(exports.channels.indexOf(channel.id) == -1)
            {
                return false;
            }
        }
    }

    return true;
}