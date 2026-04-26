const {
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    joinVoiceChannel,
} = require('@discordjs/voice');
const play = require('play-dl');
const { EmbedBuilder } = require('discord.js');

// ffmpeg-static 경로 명시
process.env.FFMPEG_PATH = require('ffmpeg-static');

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

    if (queue.songs.length === 0) {
        queue.current = null;
        const embed = new EmbedBuilder()
            .setDescription('📭 대기열이 비었습니다. 음성 채널에서 나갑니다.')
            .setColor(0x808080);
        queue.textChannel.send({ embeds: [embed] }).catch(() => {});
        setTimeout(() => destroyQueue(guildId), 1000);
        return;
    }

    const song = queue.songs.shift();
    queue.current = song;

    try {
        const stream = await play.stream(song.url, { quality: 2 });
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: false,
        });
        queue.player.play(resource);

        const embed = new EmbedBuilder()
            .setTitle('🎵 재생 중')
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

module.exports = { getQueue, createQueue, destroyQueue, processNext, addAndPlay, joinChannel };
