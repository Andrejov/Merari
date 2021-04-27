const Discord = require('discord.js');
const yargs = require('yargs')

const auth = require("./auth.json")

const db = require("./db");
const dbops = require("./dbops")
const sub = require("./sub")
const handler = require("./bot/handler")

const bot = new Discord.Client({ws : { intents: new Discord.Intents( [ Discord.Intents.NON_PRIVILEGED, "GUILD_MEMBERS"] ) }}  );;

const argv = yargs
    .option('cluster', {
        alias : 'c',
        description : 'Sets the desired cluster id',
        type : 'number'
    })
    .argv;

const clusterId = argv.cluster ? argv.cluster : 0;

exports.bot = bot;
exports.clusterId = clusterId;

console.log(`This sessions' selected cluster id is ${clusterId}`)

async function main() {
    try {
        await db.connect();
    } catch (error) {
        console.error("Could not connect; terminating");
        return;
    }

    bot.on('ready',async () => {
        await bot.user.setActivity({
            type : 'STREAMING',
            name : "Work in progress",
            url : 'https://www.twitch.tv/directory'
        })

        await dbops.updateGuilds(bot);

        var subr = await sub.loadSub();
        if(!subr)
        {
            return;
        }

        // db.clusters.updateOne({id : 0}, { $set : {
        //     guilds : [],
        //     channels : ['823953480829108285'],
        //     modes : ['channel']
        // }})
        // db.clusters.updateOne({id : 1}, { $set : {
        //     guilds : [],
        //     channels : ['823953728431587388'],
        //     modes : ['channel']
        // }})
    })

    bot.on('message', (msg) => {
        var handle = sub.handle(msg.guild,msg.channel);

        console.log(handle);
        if(handle)
        {
            handler.onMessage(msg);
        }
    });

    bot.login(auth.discord.api);
}

main();