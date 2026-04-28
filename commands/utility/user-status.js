const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];

const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const STATUS_LABEL = {
    online:    '🟢 온라인',
    idle:      '🟡 자리비움',
    dnd:       '🔴 방해금지',
    offline:   '⚫ 오프라인',
    invisible: '⚫ 오프라인',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('유저상태')
        .setDescription('디스코드 유저의 현재 상태를 확인합니다 (니트로 전용)')
        .addUserOption(o =>
            o.setName('유저').setDescription('조회할 유저 (미입력 시 본인)').setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const target = interaction.options.getMember('유저') ?? interaction.member;
        const presence = target.presence;
        const status = STATUS_LABEL[presence?.status ?? 'offline'];

        const embed = new EmbedBuilder()
            .setTitle(`${target.user.username} 의 상태`)
            .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
            .setColor(target.displayHexColor === '#000000' ? 0x5865F2 : target.displayColor)
            .addFields({ name: '상태', value: status, inline: true });

        // 기기 정보
        if (presence?.clientStatus) {
            const devices = [];
            if (presence.clientStatus.desktop) devices.push('🖥️ PC');
            if (presence.clientStatus.mobile)  devices.push('📱 모바일');
            if (presence.clientStatus.web)     devices.push('🌐 웹');
            if (devices.length) embed.addFields({ name: '기기', value: devices.join(' · '), inline: true });
        }

        // 현재 활동
        const activities = presence?.activities ?? [];
        for (const act of activities) {
            if (act.name === 'Custom Status') {
                embed.addFields({ name: '💬 커스텀 상태', value: act.state ?? '없음' });
                continue;
            }
            const detail = [act.details, act.state].filter(Boolean).join('\n');
            embed.addFields({ name: `🎮 ${act.name}`, value: detail || '활동 중' });
        }

        embed.setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
