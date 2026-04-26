const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const { getQueue, createQueue, addAndPlay, joinChannel } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('노래재생')
        .setDescription('YouTube 음악을 재생하거나 대기열에 추가합니다')
        .addStringOption(option =>
            option.setName('검색어').setDescription('YouTube URL 또는 검색어').setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('음성 채널에 먼저 입장해주세요.');
        }

        const query = interaction.options.getString('검색어');
        let song;

        try {
            const validated = play.yt_validate(query);
            if (validated === 'video') {
                const info = await play.video_info(query);
                const d = info.video_details;
                song = {
                    title: d.title,
                    url: d.url,
                    thumbnail: d.thumbnails?.[0]?.url ?? null,
                    duration: d.durationRaw,
                    requestedBy: interaction.user.id,
                };
            } else {
                const results = await play.search(query, { source: { youtube: 'video' }, limit: 1 });
                if (!results?.length) return interaction.editReply('검색 결과가 없습니다.');
                const v = results[0];
                song = {
                    title: v.title,
                    url: v.url,
                    thumbnail: v.thumbnails?.[0]?.url ?? null,
                    duration: v.durationRaw,
                    requestedBy: interaction.user.id,
                };
            }
        } catch (err) {
            console.error('YouTube 정보 오류:', err);
            return interaction.editReply('YouTube 정보를 불러오는 데 실패했습니다.');
        }

        let queue = getQueue(interaction.guildId);

        if (!queue) {
            const connection = joinChannel(interaction);
            queue = createQueue(interaction.guildId, interaction.member.voice.channel, interaction.channel, connection);
        }

        const isFirst = !queue.current && queue.songs.length === 0;
        await addAndPlay(interaction.guildId, song);

        if (isFirst) {
            await interaction.editReply(`▶️ **${song.title}** 재생을 시작합니다.`);
        } else {
            const embed = new EmbedBuilder()
                .setTitle('📋 대기열에 추가됨')
                .setDescription(`**[${song.title}](${song.url})**`)
                .setThumbnail(song.thumbnail ?? null)
                .addFields(
                    { name: '길이', value: song.duration || '알 수 없음', inline: true },
                    { name: '대기 순서', value: `${queue.songs.length}번째`, inline: true },
                )
                .setColor(0x5865F2)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
