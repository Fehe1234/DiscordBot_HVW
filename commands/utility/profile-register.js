const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkAndNotify } = require('../../utils/badges');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548']; // 부관리자, 가이드
const profilesPath = path.join(__dirname, '../../data/profiles.json');

const loadProfiles = () => JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
const saveProfiles = (data) => fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2), 'utf-8');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('프로필등록')
        .setDescription('VRChat 프로필을 등록합니다 (니트로 전용)')
        .addStringOption(o =>
            o.setName('닉네임').setDescription('VRChat 닉네임').setRequired(true)
        )
        .addStringOption(o =>
            o.setName('소개').setDescription('자기소개').setRequired(false)
        )
        .addStringOption(o =>
            o.setName('월드').setDescription('자주 가는 VRChat 월드').setRequired(false)
        )
        .addStringOption(o =>
            o.setName('한마디').setDescription('한 마디').setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const hasAccess = interaction.member.roles.cache.has(NITRO_ROLE_ID)
            || FREE_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));

        if (!hasAccess) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const profiles = loadProfiles();

        profiles[interaction.user.id] = {
            vrchatNick: interaction.options.getString('닉네임'),
            description: interaction.options.getString('소개') ?? null,
            favoriteWorld: interaction.options.getString('월드') ?? null,
            comment: interaction.options.getString('한마디') ?? null,
            discordTag: interaction.user.tag,
            updatedAt: new Date().toISOString(),
        };

        saveProfiles(profiles);
        await interaction.editReply('✅ 프로필이 등록됐습니다!');
        checkAndNotify(interaction.user.id, interaction.client);
    },
};
