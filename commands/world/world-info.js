const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];

const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const worldsPath = path.join(__dirname, '../../data/worlds.json');
const loadWorlds = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('월드정보')
        .setDescription('등록된 VRChat 월드의 상세 정보를 확인합니다 (니트로 전용)')
        .addStringOption(o =>
            o.setName('이름').setDescription('검색할 월드 이름').setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const query = interaction.options.getString('이름').toLowerCase();
        const worlds = loadWorlds();
        const results = worlds.filter(w => w.name.toLowerCase().includes(query));

        if (results.length === 0) {
            return interaction.editReply(`**${query}** 와(과) 일치하는 월드를 찾을 수 없습니다.`);
        }

        const world = results.find(w => w.name.toLowerCase() === query) ?? results[0];
        const date = new Date(world.registeredAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        const embed = new EmbedBuilder()
            .setTitle(`🌐 ${world.name}`)
            .setURL(world.link)
            .setColor(0x5865F2);

        if (world.description) embed.setDescription(world.description);

        embed.addFields(
            { name: '🎮 장르', value: world.genre, inline: true },
        );
        if (world.language)  embed.addFields({ name: '🗣️ 언어', value: world.language, inline: true });
        if (world.capacity)  embed.addFields({ name: '👥 수용인원', value: world.capacity, inline: true });
        if (world.groupSize) embed.addFields({ name: '🧑‍🤝‍🧑 추천인원', value: world.groupSize, inline: true });
        embed.addFields(
            { name: '🔗 링크', value: world.link },
            { name: '📝 등록자', value: `<@${world.registeredBy}>`, inline: true },
            { name: '📅 등록일', value: date, inline: true },
            { name: '🆔 월드 ID', value: world.id, inline: false },
        );

        if (results.length > 1) {
            embed.setFooter({ text: `"${query}" 검색 결과 ${results.length}개 중 1개 표시` });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
