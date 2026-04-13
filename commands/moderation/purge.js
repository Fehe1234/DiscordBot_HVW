const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('채팅청소')
        .setDescription('채널의 메시지를 일괄 삭제합니다 (관리자 전용)')
        .addIntegerOption(option =>
            option
                .setName('개수')
                .setDescription('삭제할 메시지 수 (1~100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('채널')
                .setDescription('청소할 채널 (기본값: 현재 채널)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasPermission(interaction.member)) {
            return interaction.editReply('이 명령어를 사용할 권한이 없습니다.');
        }

        const amount = interaction.options.getInteger('개수');
        const targetChannel = interaction.options.getChannel('채널') ?? interaction.channel;

        // 텍스트 채널 여부 확인
        if (!targetChannel.isTextBased()) {
            return interaction.editReply('텍스트 채널에서만 사용할 수 있습니다.');
        }

        // 봇의 메시지 관리 권한 확인
        const botMember = await interaction.guild.members.fetchMe();
        if (!targetChannel.permissionsFor(botMember).has(PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply(`${targetChannel} 채널에서 메시지 관리 권한이 없습니다.`);
        }

        let deleted;
        try {
            // filterOld: true — 14일 초과 메시지는 자동으로 건너뜀
            deleted = await targetChannel.bulkDelete(amount, true);
        } catch (err) {
            console.error('채팅청소 실패:', err);
            return interaction.editReply('메시지 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }

        const skipped = amount - deleted.size;
        let reply = `${targetChannel} 채널에서 메시지 **${deleted.size}개**를 삭제했습니다.`;
        if (skipped > 0) {
            reply += `\n> 14일 이상 지난 메시지 ${skipped}개는 Discord 정책상 건너뛰었습니다.`;
        }

        await interaction.editReply(reply);
    },
};
