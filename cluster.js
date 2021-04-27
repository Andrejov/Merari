const auth = require("./auth.json")
const db = require("./db");
const Discord = require('discord.js');
const yargs = require('yargs')

const argv = yargs
    .option('cluster', {
        alias : 'c',
        description : 'Sets the desired cluster id',
        type : 'number'
    })
    .argv;

const clusterId = argv.cluster ? argv.cluster : 0;

console.log(`This sessions' selected cluster id is ${clusterId}`)

const bot = new Discord.Client({ws : { intents: new Discord.Intents( [ Discord.Intents.NON_PRIVILEGED, "GUILD_MEMBERS"] ) }}  );;

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
    })

    bot.login(auth.discord.api);
}

main();