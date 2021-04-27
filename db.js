const e = require('express');
const mongo = require('mongodb');
const auth = require("./auth.json")

var client = mongo.MongoClient
// exports.client = client;
// exports = null;

function connect(cb)
{
    return new Promise(function(resolve, reject)
    {

        console.log("Setting up MongoDB connection...");
        client.connect(auth.mongodb.url,async  (err, dbs) => {
            if(err)
            {
                console.log("MongoDB connection failed");
                
                reject(err);
            }else{
                console.log("MongoDB connection set up correctly")
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