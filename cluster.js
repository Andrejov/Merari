const Discord = require('discord.js');
const yargs = require('yargs')

const auth = require("./auth.json")

const db = require("./db");
const dbops = require("./dbops")
const sub = require("./sub")
const handler = require("./bot/handler");

const bot = new Discord.Client({ws : { intents: new Discord.Intents( [ Discord.Intents.NON_PRIVILEGED, "GUILD_MEMBERS"] ) }}  );;

const argv = yargs
    .option('cluster', {
        alias : 'c',
        description : 'Sets the desired cluster id',
        type : 'number'
    })
    .argv;

const clusterId = argv.cluster ? argv.cluster : 0;
exports.activeClusters = 1;

exports.bot = bot;
exports.clusterId = clusterId;

console.log(`This sessions' selected cluster id is ${clusterId}`)

async function main() {
    try {
        await db.connect();
    } catch (error) {
        console.error("Could not connect; terminating");
        process.exit(1);
    }

    bot.on('ready',async () => {
        await bot.user.setActivity({
            type : 'STREAMING',
            name : "Work in progress",
            url : 'https://www.twitch.tv/directory'
        })

        // await bot.user.setPresence({
        //     status : 'invisible'
        // })

        await dbops.updateGuilds();

        await dbops.updateMembers();

        if(clusterId == 0)
        {
            console.log(" M: This is cluster 0; split pending...");
            await dbops.verifyClusters();

            setInterval(async () => {
                if(await dbops.verifyClusters())
                {
                    await dbops.splitClusters(exports.activeClusters);
                }
            }, 10000);

            await dbops.splitClusters(exports.activeClusters);
        }
        setInterval(() => {
            sub.poll();
        }, 5000);

        var subr = await sub.loadSub();
        if(!subr)
        {
            process.exit(1);
        }

        handler.onReady();

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

        if(handle)
        {
            handler.onMessage(msg);
        }
    });

    bot.login(auth.discord.api);
}

main();