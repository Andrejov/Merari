const mongo = require('mongodb');
const auth = require("./auth.json")

var client = mongo.MongoClient
// exports.client = client;
// exports = null;

function connect(cb)
{
    return new Promise(function(resolve, reject)
    {

        console.log(" DB: Setting up MongoDB connection...");
        client.connect(auth.mongodb.url, {useNewUrlParser: true, useUnifiedTopology: true},async  (err, dbs) => {
            if(err)
            {
                console.log(" DB: MongoDB connection failed");
                
                reject(err);
            }else{
                console.log(" DB: MongoDB connection set up correctly")
                exports.client = dbs;

                var db = dbs.db("merari");
                exports.db = db;

                exports.guilds = db.collection("guilds");
                exports.users = db.collection("users");
                exports.members = db.collection("members");

                exports.clusters = db.collection("clusters");

                resolve(db);
            }
        })
    })
}
function get(coll, id)
{
    return new Promise(function(resolve, reject) {
        exports.db.collection(coll).find({id : id}).toArray(function(err, result) {
            if(err)
            {
                resolve(null);
            }else{
                resolve(result.length > 0 ? result[0] : null);
            }
        })
    })
}
function gets(coll, query, params)
{
    if(!query) query = {};

    return new Promise(function(resolve, reject) {
        exports.db.collection(coll).find(query,params ? { projection : params } : undefined).toArray((err, result) => {
            if(err)
            {
                resolve([]);
            }else{
                resolve(result);
            }
        })
    })
}

function getsk(coll, query, params)
{
    return gets(coll, query, params).then(arr => {
        return new Promise((resolve,reject) => {
            var obj = {};

            arr.forEach(e => {
                obj[e.id] = e;
            });

            resolve(obj);
        })
    })
}

exports.connect = connect;

exports.guild = async function(id)
{
    return get("guilds", id);
}
exports.user = async function(id)
{
    return get("users", id);
}
exports.member = async function(id)
{
    return get("members", id);
}
exports.cluster = async function(id)
{
    return get("clusters", id);
}

exports.member2 = function (guildId, memberId) {
    return exports.member(`${guildId}-${memberId}`)
}

exports.guildss = async function(query, params)
{
    return gets("guilds", query,params);
}
exports.userss = async function(query, params)
{
    return gets("users", query,params);
}
exports.memberss = async function(query, params)
{
    return gets("members", query,params);
}
exports.clusterss = async function(query, params)
{
    return gets("clusters", query,params);
}

exports.guildsk = async function(query, params)
{
    return getsk("guilds", query,params);
}

exports.membersk = async function(query, params)
{
    return getsk("members", query,params);
}