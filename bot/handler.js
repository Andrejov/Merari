const Discord = require('discord.js');

const cluster = require('../cluster')
const db = require('../db')

/**
 * 
 * @param {Discord.Message} msg
 */
exports.onMessage = function(msg)
{
    if(msg.content == "cluster")
    {
        msg.reply(cluster.clusterId);
    }
}