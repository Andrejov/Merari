const Discord = require("discord.js")

const db = require("./db")

/**
 * 
 * @param {Discord.Client} bot 
 */
exports.updateGuilds = async function(bot)
{
    console.log(" DBOPS: Guild update pending...");

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