const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('재개')
        .setDescription('일시정지된 재생을 다시 시작합니다'),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue?.current) {
            return interaction.reply({ content: '현재 재생 중인 곡이 없습니다.', ephemeral: true });
        }

        queue.player.unpause();
        await interaction.reply('▶️ 재생을 재개합니다.');
    },
};
