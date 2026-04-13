const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { hasPermission } = require('../../utils/permissions');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../data/settings.json');

const loadSettings = () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('공지')
        .setDescription('공지 채널에 공지를 전송합니다 (관리자 전용)')
        .addStringOption(option =>
            option.setName('제목').setDescription('공지 제목').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('내용').setDescription('공지 내용').setRequired(true)
        ),

    async execute(interaction) {
        if (!hasPermission(interaction.member)) {
            return interaction.reply({ content: '이 명령어를 사용할 권한이 없습니다.', flags: MessageFlags.Ephemeral });
        }

        const settings = loadSettings();
        const channelId = settings[interaction.guildId]?.announceChannel;

        if (!channelId) {
            return interaction.reply({
                content: '공지 채널이 설정되지 않았습니다. `/공지설정` 으로 먼저 채널을 설정해주세요.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            return interaction.reply({
                content: '설정된 공지 채널을 찾을 수 없습니다. `/공지설정` 으로 다시 설정해주세요.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const title = interaction.options.getString('제목');
        const content = interaction.options.getString('내용');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(content)
            .setColor(0x5865F2)
            .setFooter({ text: `공지 | ${interaction.user.tag}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `${channel} 에 공지를 전송했습니다.`, flags: MessageFlags.Ephemeral });
    },
};
