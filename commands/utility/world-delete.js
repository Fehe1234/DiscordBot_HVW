const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasPermission } = require('../../utils/permissions');
const fs = require('fs');
const path = require('path');

const worldsPath = path.join(__dirname, '../../data/worlds.json');
const loadWorlds = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));
const saveWorlds = (data) => fs.writeFileSync(worldsPath, JSON.stringify(data, null, 2), 'utf-8');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('월드삭제')
        .setDescription('등록한 VRChat 월드를 삭제합니다')
        .addStringOption(o =>
            o.setName('이름').setDescription('삭제할 월드 이름').setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const name = interaction.options.getString('이름');
        const worlds = loadWorlds();
        const idx = worlds.findIndex(w => w.name === name);

        if (idx === -1) {
            return interaction.editReply(`**${name}** 이름의 월드를 찾을 수 없습니다.`);
        }

        const world = worlds[idx];
        const isOwner = world.registeredBy === interaction.user.id;
        const isAdmin = hasPermission(interaction.member);

        if (!isOwner && !isAdmin) {
            return interaction.editReply('본인이 등록한 월드만 삭제할 수 있습니다.');
        }

        worlds.splice(idx, 1);
        saveWorlds(worlds);

        await interaction.editReply(`🗑️ **${name}** 월드가 삭제됐습니다.`);
    },
};
