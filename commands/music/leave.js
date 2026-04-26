const { SlashCommandBuilder } = require('discord.js');
const { getQueue, destroyQueue } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('나가')
        .setDescription('봇을 음성 채널에서 내보냅니다'),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply({ content: '봇이 음성 채널에 있지 않습니다.', ephemeral: true });
        }

        destroyQueue(interaction.guildId);
        await interaction.reply('👋 음성 채널에서 나갔습니다.');
    },
};
