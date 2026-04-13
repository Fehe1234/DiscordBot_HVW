const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../../utils/permissions');

const KICK_LOG_CHANNEL_ID = '1383773094837223436';

const resolveTarget = async (input, guild) => {
    const id = input.replace(/[<@!>]/g, '').trim();
    try {
        return await guild.members.fetch(id);
    } catch {
        return null;
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('킥')
        .setDescription('사용자를 서버에서 추방합니다 (관리자 전용)')
        .addStringOption(option =>
            option.setName('대상').setDescription('추방할 사용자 (멘션 또는 사용자 ID)').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('사유').setDescription('추방 사유').setRequired(false)
        )
        .addAttachmentOption(option =>
            option.setName('증거').setDescription('증거 이미지 (선택사항)').setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        if (!hasPermission(interaction.member)) {
            return interaction.editReply('이 명령어를 사용할 권한이 없습니다.');
        }

        const input = interaction.options.getString('대상');
        const reason = interaction.options.getString('사유') ?? '사유 없음';
        const image = interaction.options.getAttachment('증거');
        const target = await resolveTarget(input, interaction.guild);

        if (!target) {
            return interaction.editReply('대상 사용자를 찾을 수 없습니다. 올바른 멘션 또는 사용자 ID를 입력해주세요.');
        }

        if (!target.kickable) {
            return interaction.editReply('해당 사용자를 추방할 수 없습니다. (권한 부족)');
        }

        try {
            await target.kick(reason);
            await interaction.editReply(`**${target.user.tag}** 님을 추방했습니다.\n사유: ${reason}`);

            const logChannel = await interaction.guild.channels.fetch(KICK_LOG_CHANNEL_ID).catch(() => null);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('👢 킥')
                    .setColor(0xFFA500)
                    .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
                    .addFields(
                        { name: '대상', value: `${target.user.tag} (<@${target.id}>)`, inline: true },
                        { name: '담당자', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '사유', value: reason },
                    )
                    .setTimestamp();
                if (image) embed.setImage(image.url);
                await logChannel.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error(err);
            await interaction.editReply('추방 처리 중 오류가 발생했습니다.');
        }
    },
};
