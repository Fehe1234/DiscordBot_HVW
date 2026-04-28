const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];
const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const worldsPath  = path.join(__dirname, '../../data/worlds.json');
const reviewsPath = path.join(__dirname, '../../data/reviews.json');
const loadWorlds  = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));
const loadReviews = () => JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('랜덤월드')
        .setDescription('랜덤으로 월드를 추천해줍니다 (니트로 전용)')
        .addStringOption(o =>
            o.setName('장르').setDescription('특정 장르에서 뽑기 (미입력 시 전체)').setRequired(false)
                .addChoices(
                    { name: '😱 공포', value: '공포' },
                    { name: '🌿 힐링', value: '힐링' },
                    { name: '🎮 게임', value: '게임' },
                    { name: '💬 소셜', value: '소셜' },
                    { name: '🗺️ 관광', value: '관광' },
                    { name: '🎨 기타', value: '기타' },
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const genre = interaction.options.getString('장르');
        let worlds = loadWorlds();
        if (genre) worlds = worlds.filter(w => w.genre === genre);

        if (!worlds.length) return interaction.editReply('해당 장르의 월드가 없습니다.');

        const world = worlds[Math.floor(Math.random() * worlds.length)];
        const reviews = loadReviews();
        const list = reviews[world.id] ?? [];
        const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null;

        const embed = new EmbedBuilder()
            .setTitle(`🎲 랜덤 추천: ${world.name}`)
            .setURL(world.link)
            .setColor(0x5865F2);

        if (world.description) embed.setDescription(world.description);

        embed.addFields({ name: '🎮 장르', value: world.genre, inline: true });
        if (world.language)  embed.addFields({ name: '🗣️ 언어', value: world.language, inline: true });
        if (world.groupSize) embed.addFields({ name: '👥 추천인원', value: world.groupSize, inline: true });
        if (avg)             embed.addFields({ name: '⭐ 평점', value: `${avg}점 (${list.length}개)`, inline: true });
        embed.addFields({ name: '🔗 링크', value: world.link });
        embed.setFooter({ text: `전체 ${loadWorlds().length}개 중 랜덤 선택` }).setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
