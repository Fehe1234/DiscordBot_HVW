const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('페헤')
        .setDescription('페헤님에 대해 알아봅니다'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('페헤님은 누구?')
            .setDescription('Hello! VRChat World! 서버를 운영하고 계시는 멋있고 저를 만들어 주신 분 입니다!')
            .setColor(0x5865F2)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
