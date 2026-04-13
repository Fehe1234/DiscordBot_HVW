const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../data/settings.json');

const loadSettings = () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
const saveSettings = (data) => fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce-setup')
        .setDescription('공지를 보낼 채널을 설정합니다 (관리자 전용)')
        .addChannelOption(option =>
            option.setName('채널').setDescription('공지 채널').setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('채널');

        const settings = loadSettings();
        if (!settings[interaction.guildId]) settings[interaction.guildId] = {};
        settings[interaction.guildId].announceChannel = channel.id;
        saveSettings(settings);

        await interaction.reply({
            content: `공지 채널이 ${channel} 으로 설정됐습니다.`,
            ephemeral: true,
        });
    },
};
