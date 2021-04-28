const Discord = require('discord.js');

const cluster = require('../cluster')
const db = require('../db')

const commands = require("./commands")

/**
 * 
 * @param {Discord.Message} msg
 */
exports.onMessage = async function(msg)
{
    // if(msg.content == "cluster")
    // {
    //     msg.reply(cluster.clusterId);
    // }
    await commands.handleMessage(msg);
}

exports.onReady = async function() {
    await commands.register();
}