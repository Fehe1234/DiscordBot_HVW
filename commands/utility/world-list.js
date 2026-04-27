const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const worldsPath = path.join(__dirname, '../../data/worlds.json');
const PAGE_SIZE = 10;

const loadWorlds = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));

const buildEmbed = (worlds, page) => {
    const total = worlds.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const slice = worlds.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const lines = slice.map((w, i) => {
        const idx = page * PAGE_SIZE + i + 1;
        return `**${idx}.** ${w.name}`;
    });

    return new EmbedBuilder()
        .setTitle('🌐 VRChat 월드 추천 목록')
        .setDescription(lines.join('\n\n') || '등록된 월드가 없습니다.')
        .setColor(0x5865F2)
        .setFooter({ text: `${page + 1} / ${totalPages} 페이지 · 총 ${total}개` })
        .setTimestamp();
};

const buildButtons = (page, totalPages) =>
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('world_prev')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId('world_next')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1),
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('월드목록')
        .setDescription('등록된 VRChat 월드 추천 목록을 확인합니다'),

    async execute(interaction) {
        await interaction.deferReply();

        const worlds = loadWorlds();
        const totalPages = Math.max(1, Math.ceil(worlds.length / PAGE_SIZE));
        let page = 0;

        const msg = await interaction.editReply({
            embeds: [buildEmbed(worlds, page)],
            components: totalPages > 1 ? [buildButtons(page, totalPages)] : [],
        });

        if (totalPages <= 1) return;

        const collector = msg.createMessageComponentCollector({ time: 120_000 });

        collector.on('collect', async (btn) => {
            await btn.deferUpdate();
            if (btn.customId === 'world_prev') page = Math.max(0, page - 1);
            if (btn.customId === 'world_next') page = Math.min(totalPages - 1, page + 1);

            await interaction.editReply({
                embeds: [buildEmbed(worlds, page)],
                components: [buildButtons(page, totalPages)],
            });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};
