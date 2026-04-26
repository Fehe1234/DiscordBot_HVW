const { SlashCommandBuilder } = require('discord.js');
const { getQueue, destroyQueue } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('정지')
        .setDescription('재생을 멈추고 대기열을 초기화한 뒤 음성 채널에서 나갑니다'),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply({ content: '현재 재생 중인 곡이 없습니다.', ephemeral: true });
        }

        destroyQueue(interaction.guildId);
        await interaction.reply('⏹️ 재생을 멈추고 대기열을 초기화했습니다.');
    },
};
