const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const resolveTarget = async (input, guild) => {
    const id = input.replace(/[<@!>]/g, '').trim();
    try {
        return await guild.members.fetch(id);
    } catch {
        return null;
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('사용자를 서버에서 밴합니다 (관리자 전용)')
        .addStringOption(option =>
            option.setName('대상').setDescription('밴할 사용자 (멘션 또는 사용자 ID)').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('사유').setDescription('밴 사유').setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const input = interaction.options.getString('대상');
        const reason = interaction.options.getString('사유') ?? '사유 없음';
        const target = await resolveTarget(input, interaction.guild);

        if (!target) {
            return interaction.reply({ content: '대상 사용자를 찾을 수 없습니다. 올바른 멘션 또는 사용자 ID를 입력해주세요.', ephemeral: true });
        }

        if (!target.bannable) {
            return interaction.reply({ content: '해당 사용자를 밴할 수 없습니다. (권한 부족)', ephemeral: true });
        }

        try {
            await target.ban({ reason });
            await interaction.reply(`**${target.user.tag}** 님을 밴했습니다.\n사유: ${reason}`);
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '밴 처리 중 오류가 발생했습니다.', ephemeral: true });
        }
    },
};
