const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getUnlockedBadges } = require('../../utils/badges');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];
const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const profilesPath = path.join(__dirname, '../../data/profiles.json');
const loadProfiles = () => JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
const saveProfiles = (d) => fs.writeFileSync(profilesPath, JSON.stringify(d, null, 2), 'utf-8');

// 기존 칭호 괄호 제거
const stripTitle = (nick) => nick ? nick.replace(/^\[.*?\]\s*/, '') : null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('칭호')
        .setDescription('프로필에 표시될 칭호를 설정합니다 (니트로 전용)')
        .addSubcommand(sub =>
            sub.setName('설정')
                .setDescription('칭호를 설정합니다')
                .addStringOption(o =>
                    o.setName('칭호').setDescription('표시할 칭호 (최대 20자, 해금된 뱃지 칭호도 입력 가능)').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('삭제').setDescription('설정된 칭호를 삭제합니다')
        )
        .addSubcommand(sub =>
            sub.setName('목록').setDescription('해금된 뱃지 칭호 목록을 확인합니다')
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const sub = interaction.options.getSubcommand();
        const profiles = loadProfiles();
        const userId = interaction.user.id;
        const member = interaction.member;

        if (sub === '목록') {
            const badges = getUnlockedBadges(userId);
            if (!badges.length) return interaction.editReply('아직 해금된 뱃지 칭호가 없습니다.');
            const list = badges.map(b => `${b.title} — ${b.desc}`).join('\n');
            return interaction.editReply(`🏅 **해금된 칭호 목록**\n\n${list}`);
        }

        if (!profiles[userId]) {
            return interaction.editReply('먼저 `/프로필등록` 으로 VRChat 프로필을 등록해주세요.');
        }

        if (sub === '설정') {
            const title = interaction.options.getString('칭호');
            if (title.length > 20) return interaction.editReply('칭호는 최대 20자까지 가능합니다.');

            // 원본 닉네임 저장 (최초 설정 시)
            const currentNick = member.nickname ?? member.user.username;
            const originalNick = stripTitle(currentNick);
            if (!profiles[userId].originalNickname) {
                profiles[userId].originalNickname = originalNick;
            }

            profiles[userId].title = title;
            saveProfiles(profiles);

            // 닉네임 변경
            const newNick = `[${title}] ${profiles[userId].originalNickname}`;
            const nickResult = await member.setNickname(newNick).catch(e => e);
            const nickMsg = nickResult instanceof Error
                ? `\n⚠️ 닉네임 변경 실패: ${nickResult.message}`
                : `\n닉네임: \`${newNick}\``;

            await interaction.editReply(`✨ 칭호가 **${title}** 로 설정됐습니다!${nickMsg}`);

        } else if (sub === '삭제') {
            if (!profiles[userId].title) return interaction.editReply('설정된 칭호가 없습니다.');

            const original = profiles[userId].originalNickname ?? member.user.username;
            delete profiles[userId].title;
            delete profiles[userId].originalNickname;
            saveProfiles(profiles);

            // 닉네임 복원
            const restoreResult = await member.setNickname(original).catch(e => e);
            const restoreMsg = restoreResult instanceof Error
                ? `\n⚠️ 닉네임 복원 실패: ${restoreResult.message}`
                : `\n닉네임: \`${original}\``;

            await interaction.editReply(`🗑️ 칭호가 삭제됐습니다.${restoreMsg}`);
        }
    },
};
