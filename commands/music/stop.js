const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('노래정지')
        .setDescription('현재 재생을 일시정지합니다'),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue?.current) {
            return interaction.reply({ content: '현재 재생 중인 곡이 없습니다.', ephemeral: true });
        }

        queue.player.pause();
        await interaction.reply('⏸️ 일시정지했습니다.');
    },
};
