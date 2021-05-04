const Discord = require("discord.js")
const cluster = require("../cluster")
const commands = require("./commands")

/**
 * 
 * @param {Discord.Message} msg 
 * @param {commands.ArgStruct} argstruct 
 * @param {string} permissions
 * @param {string} doReply
 */
exports.v = async function(msg, argstruct, permissions, doReply)
{
    // var members = await msg.guild.members.fetch();
    var members = msg.guild.members.cache.array();
    var args = msg.content.split(' ');
    var cmd = args.shift();

    var valid = true;
    var hasPermission = true;
    var invalid = -1;
    var vargs = [];

    // if(!permissions || msg.author.id == bot.config.admin || 
    //     (permissions != "UNOBTAINABLE_PERMISSION" && msg.member.hasPermission(permissions)))
    // {
    if(!permissions)
    {
        // argstruct.forEach(async (at, index) => {
        for(index = 0; index < argstruct.length; index++)
        {
            var at = argstruct[index];
            var optional = at.startsWith("u");
            var argVal = null;
    
            if(!valid)
            {
                vargs.push(null);
                return;
            }
    
            if(optional) at = at.substr(1);
    
            if(args.length > 0)
            {
                var next = args.shift();
    
                if(at == "text")
                {
                    argVal = `${next} ${args.join(' ')}`;
                }else if(at == "word")
                {
                    argVal = next;
                }else if(at == "mention")
                {
                    if(next.startsWith("<@!") && next.endsWith(">"))
                    {
                        var uid = next.substr(3);
                        uid = uid.substr(0, uid.length - 1);
    
                        var user = cluster.bot.users.cache.find(user => user.id == uid);
    
                        if(user)
                        {
                           argVal = user; 
                        }else{
                            valid = false;
                            invalid = index;
                        }
                    }else{
                        var found = null;

                        if(!found)
                        {
                            var f = null;
                            try {
                                f = await cluster.bot.users.fetch(next);
                            } catch (error) {
                                
                            }

                            if(f)
                            {
                                found = f;
                            }
                            // cluster.bot.users.cache.forEach((m) => {
                            //     if(m.id == next)
                            //     {
                            //         found = m;
                            //         return;
                            //     }
                            // })
                            // members.forEach((m) => {
                            //     if(m.user.id == next)
                            //     {
                            //         found = m;
                            //         return;
                            //     }
                            // })
                        }
                        if(!found)
                        {
                            members.forEach((m) => {
                                if(m.user.tag == next)
                                {
                                    found = m.user;
                                    return;
                                }
                            })
                        }
                        if(!found)
                        {
                            members.forEach((m) => {
                                if(m.user.username == next)
                                {
                                    found = m.user;
                                    return;
                                }
                            })
                        }
                        if(!found)
                        {
                            members.forEach((m) => {
                                if(m.nickname == next)
                                {
                                    found = m.user;
                                    return;
                                }
                            })
                        }
                        
                        if(found)
                        {
                            argVal = found;
                        }else{
                            valid = false;
                            invalid = index;
                        }
                    }
                    // }else{
                    //     valid = false;
                    //     invalid = index;
                    // }
                }else{
                    if(isNaN(next))
                    {
                        valid = false;
                        invalid = index;
                    }else{
                        var num = parseFloat(next);
                        if(at == "decimal")
                        {
                            argVal = num;
                        }else{
                            if(Math.round(num) == num)
                            {
                                if(at == "wnumber")
                                {
                                    argVal = num;
                                }else{
                                    if(num >= 0)
                                    {
                                        argVal = num;
                                    }else{
                                        valid = false;
                                        invalid = index;
                                    }
                                }
                            }else{
                                valid = false;
                                invalid = index;
                            }
                        }
                    }
                }
            }else{
                if(!optional)
                {
                    valid = false;
                    invalid = index;
                }
            }
    
            vargs.push(argVal);
        } //);
    }else{
        valid = false;
        hasPermission = false;
    }
    

    if(doReply)
    {
        if(hasPermission)
        {
            if(!valid)
            {
                var syntax = `Proper usage: ${doReply}`;
                argstruct.forEach((at,index) => {
                    var optional = at.startsWith("u");
                    if(optional) at = at.substr(1);

                    var name = "???";

                    if(at == "text")
                    {
                        name = "text string"
                    }else if(at == "word")
                    {
                        name = "one_word"
                    }else if(at == "number")
                    {
                        name = "0..∞ integer"
                    }else if(at == "wnumber")
                    {
                        name = "-∞..∞ integer"
                    }else if(at == "decimal")
                    {
                        name = "-∞..∞ decimal"
                    }else if(at == "mention")
                    {
                        name = "@mention"
                    }

                    if(optional)
                    {
                        name = `[${name}]`
                    }else{
                        name = `<${name}>`
                    }

                    if(invalid == index)
                    {
                        name = `**${name}**`
                    }
                    syntax = syntax + ' ' + name
                })

                await msg.channel.rtitled("Syntax error", syntax);
                // await msg.channel.rsimple(syntax);
            }
        }else{
            await msg.channel.rtitled("Missing permission",
            `You need the *${permissions}* permission to access '${doReply}' command`)
            //await msg.channel.rsimple(`You need the *${permissions}* permission to access ${doReply} command`)
        }
    }

    return {
        raw : args,
        values : vargs,
        valid : valid,
        invalid : invalid
    }
}