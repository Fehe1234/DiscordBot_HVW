const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('핑')
        .setDescription('봇의 현재 통신 상태를 확인합니다'),

    async execute(interaction) {
        const { resource } = await interaction.reply({ content: '핑 측정 중...', withResponse: true });
        const sent = resource.message;

        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const websocket = interaction.client.ws.ping;

        await interaction.editReply(
            `🏓 **Pong!**\n` +
            `📡 왕복 지연: **${roundtrip}ms**\n` +
            `💓 WebSocket: **${websocket}ms**`
        );
    },
};
