const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { hasPermission } = require('../../utils/permissions');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../data/settings.json');
const loadSettings = () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('공지')
        .setDescription('지정된 공지 채널에 공지를 전송합니다 (관리자 전용)')
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

        const settings = loadSettings();
        const channelId = settings[interaction.guildId]?.announceChannel;

        if (!channelId) {
            return interaction.editReply('공지 채널이 설정되지 않았습니다. `/공지설정` 으로 먼저 채널을 설정해주세요.');
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            return interaction.editReply('설정된 공지 채널을 찾을 수 없습니다. `/공지설정` 으로 다시 설정해주세요.');
        }

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
