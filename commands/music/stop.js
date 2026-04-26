const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('노래정지')
        .setDescription('재생을 멈추고 대기열을 초기화합니다'),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply({ content: '현재 재생 중인 곡이 없습니다.', ephemeral: true });
        }

        queue.songs = [];
        queue.current = null;
        queue.stopping = true;
        queue.player.stop();

        await interaction.reply('⏹️ 재생을 멈추고 대기열을 초기화했습니다.');
    },
};
