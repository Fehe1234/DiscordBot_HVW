const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const cooldowns = new Map();
const COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5시간

module.exports = {
    data: new SlashCommandBuilder()
        .setName('신고')
        .setDescription('관리자에게 신고를 접수합니다')
        .addStringOption(option =>
            option.setName('내용').setDescription('신고 내용을 입력해주세요').setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName('첨부파일').setDescription('사진 또는 파일을 첨부해주세요').setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.user.id;
        const now = Date.now();
        const lastUsed = cooldowns.get(userId);

        const isOwner = userId === interaction.guild.ownerId;

        if (!isOwner && lastUsed) {
            const remaining = COOLDOWN_MS - (now - lastUsed);
            if (remaining > 0) {
                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor((remaining % 3600000) / 60000);
                return interaction.editReply(
                    `신고는 5시간에 한 번만 가능합니다. 다음 신고까지 **${hours}시간 ${minutes}분** 남았습니다.`
                );
            }
        }

        const content = interaction.options.getString('내용');
        const attachment = interaction.options.getAttachment('첨부파일');
        const ownerId = interaction.guild.ownerId;

        let owner;
        try {
            owner = await interaction.client.users.fetch(ownerId);
        } catch {
            return interaction.editReply('신고 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🚨 신고가 접수됐습니다')
            .addFields(
                { name: '신고자', value: `<@${userId}> (${interaction.user.tag})`, inline: true },
                { name: '서버', value: interaction.guild.name, inline: true },
                { name: '신고 내용', value: content }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(0xED4245)
            .setTimestamp();

        if (attachment) {
            if (attachment.contentType?.startsWith('image/')) {
                embed.setImage(attachment.url);
            } else {
                embed.addFields({ name: '첨부파일', value: `[${attachment.name}](${attachment.url})` });
            }
        }

        try {
            await owner.send({ embeds: [embed] });
            cooldowns.set(userId, now);
            await interaction.editReply('신고가 접수됐습니다. 관리자가 확인 후 조치할 예정입니다.');
        } catch {
            return interaction.editReply('신고 전송에 실패했습니다. 관리자의 DM이 열려있는지 확인해주세요.');
        }
    },
};
