const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];

const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const profilesPath = path.join(__dirname, '../../data/profiles.json');
const loadProfiles = () => JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('내정보')
        .setDescription('나의 디스코드 정보와 VRChat 프로필을 함께 확인합니다 (니트로 전용)'),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const member = interaction.member;
        const user = member.user;
        const profile = loadProfiles()[user.id];

        const createdAt = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`;
        const joinedAt = member.joinedAt
            ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>`
            : '알 수 없음';

        const roles = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => `${r}`)
            .join(' ') || '없음';

        const embed = new EmbedBuilder()
            .setTitle(`${user.username} 의 내 정보`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setColor(member.displayHexColor === '#000000' ? 0x5865F2 : member.displayColor)
            .addFields(
                { name: '🏷️ 사용자명', value: user.tag, inline: true },
                { name: '🆔 사용자 ID', value: user.id, inline: true },
                { name: '📅 계정 생성일', value: createdAt },
                { name: '📥 서버 참가일', value: joinedAt },
                { name: `🎭 역할 (${member.roles.cache.size - 1}개)`, value: roles },
            )
            .setTimestamp();

        if (profile) {
            embed.addFields(
                { name: '​', value: '─── 🎮 VRChat 프로필 ───' },
                { name: 'VRChat 닉네임', value: profile.vrchatNick, inline: true },
            );
            if (profile.description)   embed.addFields({ name: '소개', value: profile.description });
            if (profile.favoriteWorld) embed.addFields({ name: '🌐 자주 가는 월드', value: profile.favoriteWorld, inline: true });
            if (profile.comment)       embed.addFields({ name: '💬 한 마디', value: profile.comment, inline: true });
        } else {
            embed.addFields({ name: '🎮 VRChat 프로필', value: '등록되지 않음 (`/프로필등록` 으로 등록 가능)' });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
