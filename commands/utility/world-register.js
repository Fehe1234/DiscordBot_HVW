const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const worldsPath = path.join(__dirname, '../../data/worlds.json');
const COOLDOWN_DEFAULT = 6 * 60 * 60 * 1000; // 일반: 6시간
const COOLDOWN_NITRO   = 1 * 60 * 60 * 1000; // 니트로: 1시간
const cooldowns = new Map();

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];
const hasNitroAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const loadWorlds = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));
const saveWorlds = (data) => fs.writeFileSync(worldsPath, JSON.stringify(data, null, 2), 'utf-8');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('월드등록')
        .setDescription('VRChat 월드를 추천 목록에 등록합니다')
        .addStringOption(o => o.setName('이름').setDescription('월드 이름').setRequired(true))
        .addStringOption(o => o.setName('링크').setDescription('VRChat 월드 링크').setRequired(true))
        .addStringOption(o =>
            o.setName('장르').setDescription('월드 장르').setRequired(true)
                .addChoices(
                    { name: '😱 공포', value: '공포' },
                    { name: '🌿 힐링', value: '힐링' },
                    { name: '🎮 게임', value: '게임' },
                    { name: '💬 소셜', value: '소셜' },
                    { name: '🗺️ 관광', value: '관광' },
                    { name: '🎨 기타', value: '기타' },
                )
        )
        .addStringOption(o => o.setName('설명').setDescription('월드 설명').setRequired(false))
        .addStringOption(o => o.setName('수용인원').setDescription('최대 수용 인원 (예: 32명)').setRequired(false))
        .addStringOption(o =>
            o.setName('언어').setDescription('주요 사용 언어').setRequired(false)
                .addChoices(
                    { name: '🇰🇷 한국어', value: '한국어' },
                    { name: '🇺🇸 영어', value: '영어' },
                    { name: '🇯🇵 일본어', value: '일본어' },
                    { name: '🌐 다국어', value: '다국어' },
                )
        )
        .addStringOption(o =>
            o.setName('추천인원').setDescription('추천 인원 규모').setRequired(false)
                .addChoices(
                    { name: '🧍 솔로', value: '솔로' },
                    { name: '👥 소규모 (2~10명)', value: '소규모' },
                    { name: '👨‍👩‍👧‍👦 단체 (10명+)', value: '단체' },
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.user.id;
        const now = Date.now();
        const lastUsed = cooldowns.get(userId);
        const isNitro = hasNitroAccess(interaction.member);
        const cooldown = isNitro ? COOLDOWN_NITRO : COOLDOWN_DEFAULT;

        if (lastUsed) {
            const remaining = cooldown - (now - lastUsed);
            if (remaining > 0) {
                const h = Math.floor(remaining / 3600000);
                const m = Math.floor((remaining % 3600000) / 60000);
                const limit = isNitro ? '1시간' : '6시간';
                return interaction.editReply(`월드 등록은 ${limit}에 한 번만 가능합니다. **${h}시간 ${m}분** 후 다시 시도해주세요.`);
            }
        }

        const name  = interaction.options.getString('이름');
        const link  = interaction.options.getString('링크');
        const genre = interaction.options.getString('장르');

        if (!link.startsWith('https://')) {
            return interaction.editReply('올바른 VRChat 링크를 입력해주세요. (https://로 시작해야 합니다)');
        }

        const worlds = loadWorlds();

        const dupName = worlds.find(w => w.name === name);
        if (dupName) {
            return interaction.editReply(`이미 **${name}** 이름의 월드가 등록되어 있습니다.`);
        }

        const dupLink = worlds.find(w => w.link === link);
        if (dupLink) {
            return interaction.editReply(`이미 동일한 링크의 월드가 **${dupLink.name}** 으로 등록되어 있습니다.`);
        }

        const world = {
            id: `${now}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            link,
            genre,
            description:  interaction.options.getString('설명') ?? null,
            capacity:     interaction.options.getString('수용인원') ?? null,
            language:     interaction.options.getString('언어') ?? null,
            groupSize:    interaction.options.getString('추천인원') ?? null,
            registeredBy: userId,
            registeredByTag: interaction.user.tag,
            registeredAt: new Date().toISOString(),
        };

        worlds.push(world);
        saveWorlds(worlds);
        cooldowns.set(userId, now);

        await interaction.editReply(`✅ **${name}** 월드가 등록됐습니다!`);
    },
};
