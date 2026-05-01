const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../../data/profiles.json');
const loadProfiles = () => JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
const saveProfiles = (data) => fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2), 'utf-8');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('프로필삭제')
        .setDescription('등록된 VRChat 프로필을 삭제합니다'),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const profiles = loadProfiles();

        if (!profiles[interaction.user.id]) {
            return interaction.editReply('등록된 프로필이 없습니다.');
        }

        delete profiles[interaction.user.id];
        saveProfiles(profiles);
        await interaction.editReply('🗑️ 프로필이 삭제됐습니다.');
    },
};
