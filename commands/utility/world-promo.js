const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const PROMO_CHANNEL_ID = '1499430170711429203';
const PROMO_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const promosPath = path.join(__dirname, '../../data/promotions.json');

const loadPromos = () => JSON.parse(fs.readFileSync(promosPath, 'utf-8'));
const savePromos = (d) => fs.writeFileSync(promosPath, JSON.stringify(d, null, 2), 'utf-8');

const buildEmbed = (userId, name, link, desc, expiresAt) => {
    const ts = Math.floor(new Date(expiresAt).getTime() / 1000);
    const embed = new EmbedBuilder()
        .setTitle(`🌐 ${name}`)
        .setURL(link)
        .setColor(0x5865F2)
        .addFields(
            { name: '🔗 링크', value: link },
            { name: '👤 등록자', value: `<@${userId}>`, inline: true },
            { name: '⏰ 만료일', value: `<t:${ts}:F>`, inline: true },
        )
        .setTimestamp();
    if (desc) embed.setDescription(desc);
    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('월드홍보무료')
        .setDescription('VRChat 월드 홍보 관리')
        .addSubcommand(sub =>
            sub.setName('등록')
                .setDescription('내 VRChat 월드를 7일간 홍보 채널에 등록합니다')
                .addStringOption(o => o.setName('이름').setDescription('월드 이름').setRequired(true))
                .addStringOption(o => o.setName('링크').setDescription('VRChat 월드 링크').setRequired(true))
                .addStringOption(o => o.setName('홍보내용').setDescription('홍보 문구 (선택)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('갱신')
                .setDescription('등록된 월드 홍보를 7일 연장합니다')
                .addStringOption(o => o.setName('홍보내용').setDescription('홍보 문구 변경 (선택)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('삭제')
                .setDescription('등록된 월드 홍보를 삭제합니다')
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const sub = interaction.options.getSubcommand();
        const promos = loadPromos();
        const userId = interaction.user.id;
        const channel = await interaction.guild.channels.fetch(PROMO_CHANNEL_ID).catch(() => null);

        if (!channel) return interaction.editReply('홍보 채널을 찾을 수 없습니다.');

        if (sub === '등록') {
            if (promos[userId]) {
                const exp = new Date(promos[userId].expiresAt);
                if (exp > new Date()) {
                    const ts = Math.floor(exp.getTime() / 1000);
                    return interaction.editReply(`이미 등록된 홍보가 있습니다. <t:${ts}:F> 에 만료됩니다.\n갱신하려면 \`/월드홍보무료 갱신\` 을 사용해주세요.`);
                }
            }

            const name = interaction.options.getString('이름');
            const link = interaction.options.getString('링크');
            const desc = interaction.options.getString('홍보내용') ?? null;

            if (!link.startsWith('https://')) {
                return interaction.editReply('올바른 VRChat 링크를 입력해주세요. (https://로 시작)');
            }

            const expiresAt = new Date(Date.now() + PROMO_DURATION_MS).toISOString();
            const msg = await channel.send({ embeds: [buildEmbed(userId, name, link, desc, expiresAt)] });

            promos[userId] = { worldName: name, link, description: desc, messageId: msg.id, expiresAt, createdAt: new Date().toISOString() };
            savePromos(promos);

            const ts = Math.floor(new Date(expiresAt).getTime() / 1000);
            await interaction.editReply(`✅ **${name}** 홍보가 등록됐습니다! <t:${ts}:F> 에 만료됩니다.`);

        } else if (sub === '갱신') {
            const promo = promos[userId];
            if (!promo) return interaction.editReply('등록된 홍보가 없습니다. `/월드홍보무료 등록` 으로 먼저 등록해주세요.');

            const newDesc = interaction.options.getString('홍보내용') ?? promo.description;
            const expiresAt = new Date(Date.now() + PROMO_DURATION_MS).toISOString();
            const embed = buildEmbed(userId, promo.worldName, promo.link, newDesc, expiresAt);

            let msgId = promo.messageId;
            try {
                const oldMsg = await channel.messages.fetch(promo.messageId);
                await oldMsg.edit({ embeds: [embed] });
            } catch {
                const newMsg = await channel.send({ embeds: [embed] });
                msgId = newMsg.id;
            }

            promos[userId] = { ...promo, description: newDesc, messageId: msgId, expiresAt };
            savePromos(promos);

            const ts = Math.floor(new Date(expiresAt).getTime() / 1000);
            await interaction.editReply(`🔄 **${promo.worldName}** 홍보가 갱신됐습니다! <t:${ts}:F> 에 만료됩니다.`);

        } else if (sub === '삭제') {
            const promo = promos[userId];
            if (!promo) return interaction.editReply('등록된 홍보가 없습니다.');

            const msg = await channel.messages.fetch(promo.messageId).catch(() => null);
            if (msg) await msg.delete().catch(() => {});

            delete promos[userId];
            savePromos(promos);

            await interaction.editReply(`🗑️ **${promo.worldName}** 홍보가 삭제됐습니다.`);
        }
    },
};
