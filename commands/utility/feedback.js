const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const COOLDOWN_MS = 60 * 60 * 1000; // 1시간
const cooldowns = new Map();

const OWNER_ID = '826036359499481109';
const ADMIN_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('피드백')
        .setDescription('관리자에게 피드백을 전달합니다 (1시간 쿨타임)')
        .addStringOption(o =>
            o.setName('내용').setDescription('피드백 내용').setRequired(true)
        )
        .addAttachmentOption(o =>
            o.setName('이미지').setDescription('첨부 이미지 (선택)').setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.user.id;
        const now = Date.now();
        const lastUsed = cooldowns.get(userId);

        if (lastUsed) {
            const remaining = COOLDOWN_MS - (now - lastUsed);
            if (remaining > 0) {
                const m = Math.floor(remaining / 60000);
                const s = Math.floor((remaining % 60000) / 1000);
                return interaction.editReply(`피드백은 1시간에 한 번만 가능합니다. **${m}분 ${s}초** 후 다시 시도해주세요.`);
            }
        }

        const content = interaction.options.getString('내용');
        const image   = interaction.options.getAttachment('이미지');

        const embed = new EmbedBuilder()
            .setTitle('💬 피드백이 도착했습니다')
            .setColor(0x57F287)
            .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '보낸 사람', value: `${interaction.user.tag} (<@${userId}>)`, inline: true },
                { name: '서버', value: interaction.guild.name, inline: true },
                { name: '내용', value: content },
            )
            .setTimestamp();

        if (image) embed.setImage(image.url);

        // 수신자 수집 (오너 + 부관리자 + 가이드, 중복 제거)
        const recipients = new Map();
        const owner = await interaction.client.users.fetch(OWNER_ID).catch(() => null);
        if (owner) recipients.set(OWNER_ID, owner);

        await interaction.guild.members.fetch();
        for (const roleId of ADMIN_ROLE_IDS) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) continue;
            for (const [, member] of role.members) {
                if (!recipients.has(member.id)) {
                    recipients.set(member.id, member.user);
                }
            }
        }

        let sent = 0;
        for (const [, user] of recipients) {
            await user.send({ embeds: [embed] }).then(() => sent++).catch(() => {});
        }

        if (sent === 0) {
            return interaction.editReply('피드백 전송에 실패했습니다. 관리자의 DM이 열려있는지 확인해주세요.');
        }

        cooldowns.set(userId, now);
        await interaction.editReply('✅ 피드백이 전달됐습니다. 감사합니다!');
    },
};
