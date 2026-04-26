const { SlashCommandBuilder } = require('discord.js');
const { getQueue, LOOP_OFF, LOOP_SINGLE, LOOP_ALL } = require('../../utils/MusicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('노래반복')
        .setDescription('반복 모드를 설정합니다')
        .addStringOption(option =>
            option.setName('모드')
                .setDescription('반복 모드 선택')
                .setRequired(true)
                .addChoices(
                    { name: '🚫 반복 없음', value: 'off' },
                    { name: '🔂 현재 곡 반복', value: 'single' },
                    { name: '🔁 전체 반복', value: 'all' },
                )
        ),

    async execute(interaction) {
        const queue = getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply({ content: '현재 재생 중인 곡이 없습니다.', ephemeral: true });
        }

        const mode = interaction.options.getString('모드');
        const modeMap = { off: LOOP_OFF, single: LOOP_SINGLE, all: LOOP_ALL };
        const labelMap = { off: '🚫 반복 없음', single: '🔂 현재 곡 반복', all: '🔁 전체 반복' };

        queue.loopMode = modeMap[mode];
        await interaction.reply(`반복 모드: **${labelMap[mode]}**`);
    },
};
