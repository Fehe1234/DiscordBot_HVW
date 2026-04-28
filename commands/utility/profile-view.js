const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../../data/profiles.json');
const loadProfiles = () => JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('프로필')
        .setDescription('VRChat 프로필을 조회합니다')
        .addUserOption(o =>
            o.setName('유저').setDescription('조회할 유저').setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getMember('유저');
        const profiles = loadProfiles();
        const profile = profiles[target.id];

        if (!profile) {
            return interaction.editReply(`**${target.user.tag}** 님의 프로필이 등록되어 있지 않습니다.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎮 ${profile.vrchatNick}`)
            .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
            .setColor(target.displayHexColor === '#000000' ? 0x5865F2 : target.displayColor);

        if (profile.description)   embed.setDescription(profile.description);
        if (profile.comment)       embed.addFields({ name: '💬 한 마디', value: profile.comment });
        if (profile.favoriteWorld) embed.addFields({ name: '🌐 자주 가는 월드', value: profile.favoriteWorld });

        embed.addFields({ name: '🏷️ 디스코드', value: target.user.tag, inline: true });

        const date = new Date(profile.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        embed.setFooter({ text: `마지막 업데이트: ${date}` }).setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
