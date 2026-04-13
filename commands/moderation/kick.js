const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

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
        .setName('kick')
        .setDescription('사용자를 서버에서 추방합니다 (관리자 전용)')
        .addStringOption(option =>
            option.setName('대상').setDescription('추방할 사용자 (멘션 또는 사용자 ID)').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('사유').setDescription('추방 사유').setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const input = interaction.options.getString('대상');
        const reason = interaction.options.getString('사유') ?? '사유 없음';
        const target = await resolveTarget(input, interaction.guild);

        if (!target) {
            return interaction.reply({ content: '대상 사용자를 찾을 수 없습니다. 올바른 멘션 또는 사용자 ID를 입력해주세요.', flags: MessageFlags.Ephemeral });
        }

        if (!target.kickable) {
            return interaction.reply({ content: '해당 사용자를 추방할 수 없습니다. (권한 부족)', flags: MessageFlags.Ephemeral });
        }

        try {
            await target.kick(reason);
            await interaction.reply(`**${target.user.tag}** 님을 추방했습니다.\n사유: ${reason}`);
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '추방 처리 중 오류가 발생했습니다.', flags: MessageFlags.Ephemeral });
        }
    },
};
