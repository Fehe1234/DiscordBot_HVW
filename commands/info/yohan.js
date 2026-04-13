const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yohan')
        .setDescription('요한님에 대해 알아봅니다'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('요한님은 누구?')
            .setDescription('Hello! VRChat World! 서버에서 가이드로 활동하시며 새로운 멤버들을 따뜻하게 안내해 주시는 분입니다!')
            .setColor(0x5865F2)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
