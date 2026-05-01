const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkAndNotify } = require('../../utils/badges');

const profilesPath = path.join(__dirname, '../../data/profiles.json');
const loadProfiles = () => { try { return JSON.parse(fs.readFileSync(profilesPath, 'utf-8')); } catch { return {}; } };

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];
const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const worldsPath  = path.join(__dirname, '../../data/worlds.json');
const reviewsPath = path.join(__dirname, '../../data/reviews.json');
const loadWorlds  = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));
const loadReviews = () => JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
const saveReviews = (d) => fs.writeFileSync(reviewsPath, JSON.stringify(d, null, 2), 'utf-8');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('월드리뷰')
        .setDescription('월드 평점과 리뷰를 남깁니다 (니트로 전용)')
        .addSubcommand(sub =>
            sub.setName('작성')
                .setDescription('월드에 평점과 리뷰를 남깁니다')
                .addStringOption(o => o.setName('월드').setDescription('월드 이름').setRequired(true))
                .addIntegerOption(o =>
                    o.setName('별점').setDescription('1~5점').setRequired(true)
                        .setMinValue(1).setMaxValue(5)
                )
                .addStringOption(o => o.setName('리뷰').setDescription('한 줄 리뷰').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('조회')
                .setDescription('월드의 리뷰 목록을 봅니다')
                .addStringOption(o => o.setName('월드').setDescription('월드 이름').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('삭제')
                .setDescription('내가 남긴 리뷰를 삭제합니다')
                .addStringOption(o => o.setName('월드').setDescription('월드 이름').setRequired(true))
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const sub = interaction.options.getSubcommand();
        const query = interaction.options.getString('월드').toLowerCase();
        const worlds = loadWorlds();
        const world = worlds.find(w => w.name.toLowerCase().includes(query));

        if (!world) return interaction.editReply(`**${query}** 와(과) 일치하는 월드를 찾을 수 없습니다.`);

        const reviews = loadReviews();
        if (!reviews[world.id]) reviews[world.id] = [];

        if (sub === '작성') {
            const rating = interaction.options.getInteger('별점');
            const review = interaction.options.getString('리뷰') ?? null;

            const existing = reviews[world.id].findIndex(r => r.userId === interaction.user.id);
            const entry = { userId: interaction.user.id, rating, review, createdAt: new Date().toISOString() };

            if (existing !== -1) reviews[world.id][existing] = entry;
            else reviews[world.id].push(entry);

            saveReviews(reviews);
            const stars = '⭐'.repeat(rating);
            await interaction.editReply(`${stars} **${world.name}** 에 리뷰를 남겼습니다.`);
            checkAndNotify(interaction.user.id, interaction.client);

        } else if (sub === '조회') {
            const list = reviews[world.id];
            if (!list?.length) return interaction.editReply('아직 리뷰가 없습니다.');

            const avg = (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1);
            const profiles = loadProfiles();
            const lines = list.map(r => {
                const title = profiles[r.userId]?.title;
                const badge = title ? ` ✨${title}` : '';
                return `${'⭐'.repeat(r.rating)} <@${r.userId}>${badge}${r.review ? ` — ${r.review}` : ''}`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`⭐ ${world.name} 리뷰`)
                .setDescription(lines)
                .setColor(0xFFC83D)
                .setFooter({ text: `평균 ${avg}점 · 총 ${list.length}개` });
            await interaction.editReply({ embeds: [embed] });

        } else if (sub === '삭제') {
            const idx = reviews[world.id].findIndex(r => r.userId === interaction.user.id);
            if (idx === -1) return interaction.editReply('남긴 리뷰가 없습니다.');
            reviews[world.id].splice(idx, 1);
            saveReviews(reviews);
            await interaction.editReply(`🗑️ **${world.name}** 리뷰를 삭제했습니다.`);
        }
    },
};
