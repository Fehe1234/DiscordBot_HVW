const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('스킵')
        .setDescription('현재 재생 중인 곡을 건너뜁니다'),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue?.current) {
            return interaction.reply({ content: '현재 재생 중인 곡이 없습니다.', ephemeral: true });
        }

        const skipped = queue.current.title;
        queue.player.stop();
        await interaction.reply(`⏭️ **${skipped}** 을(를) 건너뜁니다.`);
    },
};
