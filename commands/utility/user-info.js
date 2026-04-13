const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');

const loadWarnings = () => {
    try {
        return JSON.parse(fs.readFileSync(warningsPath, 'utf-8'));
    } catch {
        return {};
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('유저정보')
        .setDescription('사용자의 정보를 확인합니다')
        .addUserOption(option =>
            option.setName('대상').setDescription('정보를 확인할 사용자 (미입력 시 본인)').setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getMember('대상') ?? interaction.member;
        const user = target.user;

        const joinedAt = target.joinedAt
            ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:F>`
            : '알 수 없음';

        const createdAt = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`;

        const roles = target.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => `${r}`)
            .join(' ') || '없음';

        const warnings = loadWarnings();
        const warnCount = warnings[user.id]?.length ?? 0;

        const embed = new EmbedBuilder()
            .setTitle(`${user.username} 의 정보`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setColor(target.displayHexColor === '#000000' ? 0x5865F2 : target.displayColor)
            .addFields(
                { name: '사용자명', value: user.tag, inline: true },
                { name: '사용자 ID', value: user.id, inline: true },
                { name: '봇 여부', value: user.bot ? '봇' : '일반 유저', inline: true },
                { name: '계정 생성일', value: createdAt, inline: false },
                { name: '서버 참가일', value: joinedAt, inline: false },
                { name: `역할 (${target.roles.cache.size - 1}개)`, value: roles, inline: false },
                { name: '⚠️ 경고', value: `${warnCount}회`, inline: false },
            )
            .setFooter({ text: `요청: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
