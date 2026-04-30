const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { hasPermission } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('공지')
        .setDescription('원하는 채널에 공지를 전송합니다 (관리자 전용)')
        .addChannelOption(o =>
            o.setName('채널').setDescription('공지를 보낼 채널').setRequired(true)
        )
        .addStringOption(o =>
            o.setName('제목').setDescription('공지 제목').setRequired(true)
        )
        .addStringOption(o =>
            o.setName('내용').setDescription('공지 내용').setRequired(true)
        )
        .addAttachmentOption(o =>
            o.setName('이미지').setDescription('첨부 이미지 (선택)').setRequired(false)
        )
        .addStringOption(o =>
            o.setName('멘션').setDescription('멘션 여부').setRequired(false)
                .addChoices(
                    { name: '없음', value: 'none' },
                    { name: '@everyone', value: '@everyone' },
                    { name: '@here', value: '@here' },
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasPermission(interaction.member)) {
            return interaction.editReply('이 명령어를 사용할 권한이 없습니다.');
        }

        const channel = interaction.options.getChannel('채널');
        const title   = interaction.options.getString('제목');
        const content = interaction.options.getString('내용');
        const image   = interaction.options.getAttachment('이미지');
        const mention = interaction.options.getString('멘션') ?? 'none';

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(content)
            .setColor(0x5865F2)
            .setFooter({ text: `공지 | ${interaction.user.tag}` })
            .setTimestamp();

        if (image) embed.setImage(image.url);

        const payload = { embeds: [embed] };
        if (mention !== 'none') payload.content = mention;

        await channel.send(payload);
        await interaction.editReply(`${channel} 에 공지를 전송했습니다.`);
    },
};
