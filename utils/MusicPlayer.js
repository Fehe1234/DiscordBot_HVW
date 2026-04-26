const {
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType,
    joinVoiceChannel,
} = require('@discordjs/voice');
const { exec: ytdlExec } = require('youtube-dl-exec');
const { EmbedBuilder } = require('discord.js');

// 0 = 반복 없음, 1 = 현재 곡 반복, 2 = 전체 반복
const LOOP_OFF    = 0;
const LOOP_SINGLE = 1;
const LOOP_ALL    = 2;

const queues = new Map();

function getQueue(guildId) {
    return queues.get(guildId) ?? null;
}

function createQueue(guildId, voiceChannel, textChannel, connection) {
    const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    const queue = {
        songs: [],
        current: null,
        loopMode: LOOP_OFF,
        player,
        connection,
        textChannel,
        voiceChannel,
    };
    queues.set(guildId, queue);

    player.on(AudioPlayerStatus.Idle, () => processNext(guildId));
    player.on('error', (err) => {
        console.error('플레이어 오류:', err.message);
        queue.textChannel.send(`⚠️ 재생 오류: ${err.message}`).catch(() => {});
        processNext(guildId);
    });
    connection.subscribe(player);

    return queue;
}

function destroyQueue(guildId) {
    const queue = queues.get(guildId);
    if (!queue) return;
    queue.player.stop(true);
    queue.connection.destroy();
    queues.delete(guildId);
}

async function processNext(guildId) {
    const queue = queues.get(guildId);
    if (!queue) return;

    // 현재 곡 반복
    if (queue.loopMode === LOOP_SINGLE && queue.current) {
        return playSong(guildId, queue.current);
    }

    // 전체 반복: 끝난 곡을 대기열 맨 뒤로
    if (queue.loopMode === LOOP_ALL && queue.current) {
        queue.songs.push(queue.current);
    }

    if (queue.songs.length === 0) {
        queue.current = null;
        queue.textChannel.send('📭 대기열이 비었습니다.').catch(() => {});
        return; // 채널에 그대로 대기
    }

    const song = queue.songs.shift();
    await playSong(guildId, song);
}

async function playSong(guildId, song) {
    const queue = queues.get(guildId);
    if (!queue) return;

    queue.current = song;

    try {
        const process = ytdlExec(song.url, {
            output: '-',
            quiet: true,
            format: 'bestaudio[ext=webm]/bestaudio/best',
        });

        const resource = createAudioResource(process.stdout, {
            inputType: StreamType.Arbitrary,
        });
        queue.player.play(resource);

        const loopLabel = queue.loopMode === LOOP_SINGLE ? ' 🔂' : queue.loopMode === LOOP_ALL ? ' 🔁' : '';
        const embed = new EmbedBuilder()
            .setTitle(`🎵 재생 중${loopLabel}`)
            .setDescription(`**[${song.title}](${song.url})**`)
            .setThumbnail(song.thumbnail ?? null)
            .addFields(
                { name: '요청자', value: `<@${song.requestedBy}>`, inline: true },
                { name: '길이', value: song.duration || '알 수 없음', inline: true },
                { name: '남은 대기열', value: `${queue.songs.length}곡`, inline: true },
            )
            .setColor(0xFF0000)
            .setTimestamp();
        queue.textChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
        console.error('스트림 오류:', err.message);
        queue.textChannel.send(`⚠️ **${song.title}** 재생 실패: ${err.message}\n다음 곡으로 넘어갑니다.`).catch(() => {});
        queue.current = null;
        processNext(guildId);
    }
}

async function addAndPlay(guildId, song) {
    const queue = queues.get(guildId);
    if (!queue) return;
    queue.songs.push(song);
    if (!queue.current) await processNext(guildId);
}

function joinChannel(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    return connection;
}

module.exports = {
    getQueue, createQueue, destroyQueue, processNext, addAndPlay, joinChannel,
    LOOP_OFF, LOOP_SINGLE, LOOP_ALL,
};
