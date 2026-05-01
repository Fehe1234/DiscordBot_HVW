const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const worldsPath = path.join(__dirname, '../../data/worlds.json');
const loadWorlds = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('월드조회')
        .setDescription('등록된 VRChat 월드를 이름으로 검색합니다')
        .addStringOption(o =>
            o.setName('이름').setDescription('검색할 월드 이름').setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const query = interaction.options.getString('이름').toLowerCase();
        const worlds = loadWorlds();
        const results = worlds.filter(w => w.name.toLowerCase().includes(query));

        if (results.length === 0) {
            return interaction.editReply(`**${query}** 와(과) 일치하는 월드를 찾을 수 없습니다.`);
        }

        // 정확히 일치하는 게 있으면 우선 표시
        const world = results.find(w => w.name.toLowerCase() === query) ?? results[0];

        const embed = new EmbedBuilder()
            .setTitle(`🌐 ${world.name}`)
            .setURL(world.link)
            .setColor(0x5865F2)
            .setTimestamp();

        if (world.description) embed.setDescription(world.description);

        const fields = [
            { name: '🎮 장르', value: world.genre, inline: true },
        ];

        if (world.language)  fields.push({ name: '🗣️ 언어', value: world.language, inline: true });
        if (world.capacity)  fields.push({ name: '👥 수용인원', value: world.capacity, inline: true });
        if (world.groupSize) fields.push({ name: '🧑‍🤝‍🧑 추천인원', value: world.groupSize, inline: true });

        fields.push({ name: '🔗 링크', value: world.link, inline: false });
        fields.push({ name: '📝 등록자', value: `<@${world.registeredBy}>`, inline: true });

        const date = new Date(world.registeredAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        fields.push({ name: '📅 등록일', value: date, inline: true });

        embed.addFields(fields);

        // 검색 결과가 여러 개면 하단에 안내
        if (results.length > 1) {
            embed.setFooter({ text: `"${query}" 검색 결과 ${results.length}개 중 1개 표시` });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
