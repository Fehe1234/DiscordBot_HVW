const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('큐')
        .setDescription('현재 대기열을 확인합니다'),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue?.current && !queue?.songs.length) {
            return interaction.reply({ content: '현재 대기열이 비어있습니다.', ephemeral: true });
        }

        const lines = queue.songs.slice(0, 10).map((s, i) =>
            `**${i + 1}.** [${s.title}](${s.url}) — <@${s.requestedBy}>`
        );

        const embed = new EmbedBuilder()
            .setTitle('📋 대기열')
            .setColor(0x5865F2)
            .addFields({ name: '🎵 현재 재생 중', value: queue.current ? `[${queue.current.title}](${queue.current.url})` : '없음' })
            .setTimestamp();

        if (lines.length > 0) {
            embed.addFields({ name: `다음 곡 (${queue.songs.length}곡)`, value: lines.join('\n') });
        }

        if (queue.songs.length > 10) {
            embed.setFooter({ text: `외 ${queue.songs.length - 10}곡 더 있음` });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
