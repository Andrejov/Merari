import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, StreamType, VoiceConnection } from "@discordjs/voice";
import { Guild, TextBasedChannels, VoiceChannel } from "discord.js";
import ytdl from "ytdl-core";
import ytsr from "ytsr";
import { ArgumentStructure } from "../Merari/Model/Command/Argument";
import Context from "../Merari/Model/Command/Context";
import Response from "../Merari/Model/Command/Response";
import Extension from "../Merari/Model/Extension/Extension";
import Util from "../Merari/Util/Util";

export default class PlayerExtension extends Extension
{
    guilds: Map<Guild, Queue> = new Map();

    async enable()
    {
        this.shell.register(
            ['play', 'p'],
            [
                ArgumentStructure.make('play'),
                ArgumentStructure.make('song', 'text')
            ],
            async (ctx) => {
                // if(ctx.member?.voice.channel)
                // {
                //     await this.play(
                //         ctx.guild as Guild,
                //         ctx.member?.voice.channel as VoiceChannel,
                //         ctx.args[0] as string | undefined,
                //         ctx.channel as TextBasedChannels
                //     )
                // } else {
                //     return Response.bad('You must join a voice channel first');
                // }

                let queue = this.guilds.get(ctx.guild as Guild);


                if(!ctx.member?.voice.channel)
                {
                    return Response.bad('You must join a voice channel first');
                }

                if(!queue)
                {
                    // Create a new queue for guild
                    queue = await this.createQueue(
                        ctx.guild as Guild,
                        ctx.member?.voice.channel as VoiceChannel,
                        ctx.channel as TextBasedChannels
                    )
                }

                if(ctx.argStruct.name == 'play')
                {
                    await this.playerUnpause(queue);
                } else if(ctx.argStruct.name == 'song') {
                    const added = await this.addSong(queue, ctx.args[0] as string);

                    if(added == null)
                    {
                        return Response.bad('Could not find any song matching your query');
                    } else {
                        if(queue.songs.length == 1)
                        {
                            await this.playerGoto(queue, 0);
                        }
                    }
                }

                return Response.ok();
            },
            "ANY"
        );
        this.shell.register(
            ['stop', 'killme'],
            [],
            async (ctx) => {
                // return await this.stop(ctx.guild as Guild)

                const verify = await this.verifyRequest(ctx);

                if(verify)
                {
                    return verify;
                } else {
                    const q = this.getQueue(ctx.guild);

                    await this.destroyQueue(ctx.guild as Guild);

                    await Util.embed(
                        q.textChannel,
                        'Player',
                        'Stopped playing'
                    );

                    return Response.ok();
                }
            },
            "ANY"
        );
        this.shell.register(
            ['skip', 's', 'next'],
            [],
            async (ctx) => {
                // return await this.skip(ctx.guild as Guild)

                const verify = await this.verifyRequest(ctx);

                if(verify)
                {
                    return verify;
                } else {
                    const q = this.getQueue(ctx.guild);

                    await this.playerNext(q);

                    return Response.ok();
                }
            },
            "ANY"
        );
        this.shell.register(
            ['pause', 'ps'],
            [],
            async (ctx) => {
                // return await this.pause(ctx.guild as Guild)
                
                const verify = await this.verifyRequest(ctx);

                if(verify)
                {
                    return verify;
                } else {
                    const q = this.getQueue(ctx.guild);

                    await this.playerPause(q);

                    return Response.ok();
                }
            },
            "ANY"
        );
    }

    async verifyRequest(ctx: Context): Promise<Response | null>
    {
        const queue = this.guilds.get(ctx.guild as Guild);

        if(queue)
        {
            if(ctx.member?.voice.channel)
            {
                return null;
            } else {
                return Response.bad('You must join a voice channel first');
            }
        } else {
            return Response.bad('Queue is empty')
        }
    }

    getQueue(guild?: Guild): Queue
    {
        return this.guilds.get(guild as Guild) as Queue;
    }

    async disable()
    {

    }

    async fetchUrl(str: string): Promise<Song | null>
    {
        try {
            const search = await ytsr(
                str,
                {
                    limit: 6,
                    safeSearch: false,
                }
            )

            const videos = search.items.filter(r => r.type == 'video') as ytsr.Video[];

            if(videos.length == 0)
            {
                return null;
            }

            const song = await ytdl.getInfo(videos[0].url);
            return {
                title: song.videoDetails.title,
                url: song.videoDetails.video_url
            }
        } catch (error) {
            this.logger.err(`YTSR&YTDL err ${error}`)
            return null;
        }
    }

    // async play(guild: Guild, channel: VoiceChannel, str: string | undefined, text: TextBasedChannels): Promise<Response>
    // {
    //     let song: undefined | Song;

    //     if(str)
    //     {
    //         song = await this.fetchUrl(str);
    //     }

    //     if(!this.guilds.has(guild))
    //     {
    //         const player = createAudioPlayer({
    //             behaviors: {
    //                 noSubscriber: NoSubscriberBehavior.Pause
    //             }
    //         })

    //         player.on('error', (err) => {
    //             this.logger.err(`Player error ${err}`)
    //             this.stop(guild)
    //         })

    //         player.on(AudioPlayerStatus.Idle, () => {
    //             this.skip(guild);
    //         })

    //         const conn = joinVoiceChannel({
    //             channelId: channel.id,
    //             guildId: channel.guild.id,
    //             adapterCreator: channel.guild.voiceAdapterCreator
    //         });

    //         this.guilds.set(
    //             guild, 
    //             new Queue(
    //                 conn,
    //                 player,
    //                 text
    //             )
    //         );
    //     }

    //     const queue = this.guilds.get(guild);

    //     if(song)
    //     {
    //         queue?.songs.push(song);
            
    //         await Util.embed(
    //             queue?.textChannel as TextBasedChannels,
    //             'Player',
    //             [
    //                 `**Added to queue**: \`${song.title}\``
    //             ]
    //         )

    //         // if(queue?.player.state == AudioPlayerState)
    //         // {
    //             await this.goto(guild, queue?.position as number);
    //         // }

    //         return Response.ok();
    //     } else {
    //         queue?.player.unpause();

    //         return Response.ok();
    //     }
    // }

    // async goto(guild: Guild, id: number): Promise<Response>
    // {
    //     const queue = this.guilds.get(guild);

    //     if(queue)
    //     {
    //         if(id >= 0 && id < queue.songs.length)
    //         {
    //             queue.position = id;
                
    //             const song = queue.songs[queue.position];
    //             const stream = ytdl(song.url, { filter : 'audioonly' });
    //             const res = createAudioResource(stream, {});

    //             queue?.player.play(res)
    //             queue?.connection.subscribe(queue?.player);

    //             this.logger.trace(`Playing ${song.title}`)

    //             Util.embed(
    //                 queue.textChannel,
    //                 'Player',
    //                 [
    //                     '**Now playing**: `' + song.title + '`'
    //                 ]
    //             )

    //             return Response.ok();
    //         } else {
    //             return Response.bad(`Select a number between 0 and ${queue.songs.length - 1}`)
    //         }
    //     } else{ 
    //         return Response.bad('Queue is empty');
    //     }
    // }

    // async stop(guild: Guild): Promise<Response>
    // {
    //     const queue = this.guilds.get(guild);

    //     if(queue)
    //     {
    //         queue.connection.destroy();
    //         queue.player.stop();

    //         this.guilds.delete(guild);

    //         return Response.ok();
    //     } else {
    //         return Response.bad('Queue is empty')
    //     }
    // }

    // async skip(guild: Guild): Promise<Response>
    // {
    //     const queue = this.guilds.get(guild);

    //     if(queue)
    //     {
    //         let npos = queue.position + 1;

    //         if(npos >= queue.songs.length)
    //         {
    //             npos = 0;
    //         }

    //         await this.goto(guild, npos);

    //         return Response.ok();
    //     } else {
    //         return Response.bad('Queue is empty')
    //     }
    // }

    // async pause(guild: Guild): Promise<Response>
    // {
    //     const queue = this.guilds.get(guild);

    //     if(queue)
    //     {
    //         queue.player.pause();

    //         return Response.ok();
    //     } else {
    //         return Response.bad('Queue is empty');
    //     }
    // }

    async addSong(queue: Queue, text: string): Promise<Song | null>
    {
        this.logger.trace(`Addsong in ch id ${queue.textChannel.id}`)
        const song = await this.fetchUrl(text);

        if(song)
        {
            queue.songs.push(song);

            await Util.embed(
                queue.textChannel,
                'Player',
                [
                    '**Added to queue**:',
                    '```',
                    song.title,
                    '```'
                ]
            )
            queue.poke();

            return song;
        } else {
            return null;
        }
    }

    async createQueue(guild: Guild, vc: VoiceChannel, text: TextBasedChannels): Promise<Queue>
    {
        this.logger.trace(`Creating in guild ${guild.name}`)
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        })
        const connection = joinVoiceChannel({
            channelId: vc.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator
        })

        const queue = new Queue(
            connection,
            player,
            text
        );

        player.on('error', (err) => {
            this.logger.err(`Player error in guild ${guild.name}: ${err}`)
            this.destroyQueue(guild);
        })


        player.on(AudioPlayerStatus.Idle, () => {
            this.playerIdle(guild, queue)
        })

        connection.on('error', (err) => {
            this.logger.err(`Connection error in guild ${guild.name}: ${err}`);
            
            try {
                this.destroyQueue(guild);
            } catch (error) {}
        })
        
        connection.on('stateChange', (state) => {
            if(state.status == 'disconnected' || state.status == 'destroyed')
            {
                try {
                    this.destroyQueue(guild);
                } catch (error) {}
            }
        });

        this.guilds.set(
            guild,
            queue
        )

        return queue;
    }

    async destroyQueue(guild: Guild): Promise<boolean>
    {
        this.logger.trace(`Destroying in guild ${guild.name}`)
        const queue = this.guilds.get(guild)
        
        if(queue)
        {
            queue.connection.destroy();
            queue.player.stop();

            this.guilds.delete(guild);

            return true;
        } else {
            return false;
        }
    }

    async playerGoto(queue: Queue, position: number): Promise<boolean>
    {
        this.logger.trace(`Goto ${position} in guild ch id ${queue.textChannel.id}`)
        if(position >= 0 && position < queue.songs.length)
        {
            queue.position = position;

            const song = queue.songs[queue.position];
            const stream = ytdl(song.url, {filter: 'audioonly'});
            const res = createAudioResource(stream);

            queue.player.play(res);
            queue.connection.subscribe(queue.player);

            this.logger.trace(`Started playing: '${song.title}'`);

            await Util.embed(
                queue.textChannel,
                'Player',
                [
                    '**Now playing**:',
                    '```',
                    song.title,
                    '```'
                ]
            )
            queue.poke();

            return true;
        } else {
            return false;
        }
    }

    async playerIdle(guild: Guild, queue: Queue)
    {
        this.logger.trace(`Idle in guild ${guild.name}`)
        const next = queue.position + 1;

        if(next >= queue.songs.length)
        {
            await this.destroyQueue(guild);

            await Util.embed(
                queue.textChannel,
                'Player',
                'Queue is empty - leaving'
            )
        } else {
            await this.playerNext(queue);
        }
    }

    async playerNext(queue: Queue)
    {
        this.logger.trace(`Next in guild ch id ${queue.textChannel.id}`)
        let next = queue.position + 1;

        if(next >= queue.songs.length)
        {
            next = 0;
        }

        await this.playerGoto(queue, next);
    }

    async playerPause(queue: Queue)
    {
        this.logger.trace(`Pause in guild ch id ${queue.textChannel.id}`)
        queue.player.pause();
        queue.poke();
    }

    async playerUnpause(queue: Queue)
    {
        this.logger.trace(`Unpause in guild ch id ${queue.textChannel.id}`)
        queue.player.unpause();
        queue.poke();
    }
}

export class Queue
{
    songs: Song[] = [];
    position: number = 0;
    volume = 100;

    connection: VoiceConnection;
    player: AudioPlayer;

    textChannel: TextBasedChannels;

    lastAction: number;

    constructor(connection: VoiceConnection, player: AudioPlayer, text: TextBasedChannels)
    {
        this.lastAction = new Date().getTime();
        this.connection = connection;
        this.player = player;
        this.textChannel = text;
    }

    poke()
    {
        this.lastAction = new Date().getTime();
    }
}

export type Song = {
    title: string,
    url: string
}