const Discord = require("discord.js")
const crypto = require("crypto")

const db = require("./db")
const cluster = require("./cluster");

/**
 * 
 * @param {Discord.Client} bot 
 */
exports.updateGuilds = async function()
{
    console.log(" DBOPS: Guild update pending...");

    const bot = cluster.bot;

    var inserts = 0;

    var guilds = bot.guilds.cache.array();

    var dbguilds = await db.guildsk();
    
    for(var guild of guilds)
    {
        var id = guild.id;

        if(!dbguilds[id])
        {
            console.log(` DBOPS: Guild '${guild.name}' missing document; insert pending...`);
            await db.guilds.insertOne({
                id : id,
                name : guild.name
            })
            inserts++;
        }
    }

    var dbguilds = await db.guildss();

    for(var guild of dbguilds)
    {
        var active = (!bot.guilds.cache.get(guild.id)) ? 0 : 1;

        if(guild.active != active)
        {
            console.log(` DBOPS: Guild '${guild.name}' has incorrect active state in db; update pending...`);
            await db.guilds.updateOne({ id : guild.id}, { $set : { active : active} });
            inserts++;
        }
    }

    console.log(` DBOPS: Update guilds finished with ${inserts} operations`);
}

/**
 * 
 * @param {Discord.Client} bot 
 */
exports.updateMembers = async function()
{
    console.log(" DBOPS: Member update pending...");

    const bot = cluster.bot;

    var dbmembers = await db.membersk();

    if(!dbmembers)
    {
        console.log(` DBOPS: Error when updating members collection; null response`);
        return;
    }

    console.log(` DBOPS: Currently cached members: ${Object.keys(dbmembers).length}`);

    var push = [];
    var fids = [];

    for(var guild of bot.guilds.cache.array())
    {
        var members = await guild.members.fetch();

        for(var member of members.array())
        {
            var fid = `${guild.id}-${member.user.id}`;
            fids.push(fid);

            if(!dbmembers[fid])
            {
                push.push({
                    id : fid,
                    gid : guild.id,
                    uid : member.user.id,
                    active : 1,
                    permissions : []
                })
            }
        }
    }
    
    console.log(` DBOPS: All members count: ${fids.length}`);

    var updateZero = [];
    var updateOne = [];

    for(var mid in dbmembers)
    {
        var doc = dbmembers[mid];
        var active = (fids.indexOf(doc.id) == -1) ? 0 : 1;

        if(doc.active != active)
        {
            (active == 0 ? updateZero : updateOne).push({ id : doc.id });
        }
    }

    if(updateOne.length > 0)
    {
        console.log(` DBOPS: Updating ${updateOne.length} inactive->active members`);
        await db.members.updateMany({
            $or: updateOne
        }, {
            active : 1
        })
    }
    if(updateZero.length > 0)
    {
        console.log(` DBOPS: Updating ${updateZero.length} active->inactive members`);
        await db.members.updateMany({
            $or: updateZero
        }, {
            active : 0
        })
    }

    if(push.length > 0)
    {
        console.log(` DBOPS: ${push.length} members docs missing; insert pending...`);

        await db.members.insertMany(push);
    }else{
        console.log(` DBOPS: All members are already cached;`);
    }
}

exports.splitClusters = async function(n) {
    //split by channel

    console.log(` DBOPS: Splitting into ${n} clusters...`)

    var channels = [];

    cluster.bot.guilds.cache.array().forEach(guild => {
        guild.channels.cache.forEach(ch => {
            if(ch.type != "category")
            {
                ch.guild.id
                channels.push(ch);
            }
        })
    })

    channels.sort((a,b) => {
        // var c1 = a.guild.id - b.guild.id;

        // if(c1 != 0)
        // {
        //     return c1;
        // }else{
        //     return 
        // }
        return (a.guild.id - b.guild.id) || (a.id - b.id);
    })

    var perCluster = Math.ceil(channels.length / n);

    console.log(` DBOPS: Found ${channels.length} channels total, assigning ~${perCluster}/cluster`);

    for(var i = 0; i < n; i++)
    {
        perCluster = Math.min(perCluster, channels.length);

        var part = channels.splice(0, perCluster).map((ch) => {
            return ch.id;
        });

        await db.clusters.updateOne({id : i}, {
            $set : {
                channels : part,
                modes : ["channel"],
                stampId : crypto.randomBytes(8).toString('hex')
            }
        })
    }

    await db.clusters.updateMany({
        id : { $gte : n }
    }, { 
        $set : {
            channels : [],
            guilds : [],
            stampId : crypto.randomBytes(8).toString('hex')
        }
    })

    console.log(` DBOPS: Finished assigning clusters`);
}

exports.verifyClusters = async function()
{
    var clusters = await db.clusterss();

    var active = 0;

    clusters.forEach(c => {
        if(Date.now() - c.lastPoll < 10*1000)
        {
            active += 1;
        }
    })

    if(cluster.activeClusters != active)
    {
        console.log(` DBOPS: Warning - active cluster count changed from ${cluster.activeClusters} to ${active}`)
        cluster.activeClusters = active;
        return true;
    }
    return false;
}