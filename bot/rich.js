const Discord = require('discord.js');

exports.simple = async function (channel, text) {
    var embed = {
        color : 0xaa00aa,
        description : text

    }
    
    await channel.send({
        embed : embed
    })
}
exports.titled = async function (channel,title,text) {
    var embed = {
        color : 0xaa00aa,
        description : text,
        title : title
    }
    
    await channel.send({
        embed : embed
    })
}

// Discord.Channel.prototype.rsimple = (text) => {
//     return exports.simple(this, text);
// }

Object.defineProperty(Discord.Channel.prototype, 'rsimple', {
    value : function (text) {
        return exports.simple(this, text)
    }
})
Object.defineProperty(Discord.Channel.prototype, 'rtitled', {
    value : function (title,text) {
        return exports.titled(this, title,text)
    }
})