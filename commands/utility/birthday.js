const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];
const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const birthdaysPath = path.join(__dirname, '../../data/birthdays.json');
const loadBirthdays = () => JSON.parse(fs.readFileSync(birthdaysPath, 'utf-8'));
const saveBirthdays = (d) => fs.writeFileSync(birthdaysPath, JSON.stringify(d, null, 2), 'utf-8');

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('생일')
        .setDescription('생일을 등록하거나 삭제합니다 (니트로 전용)')
        .addSubcommand(sub =>
            sub.setName('등록')
                .setDescription('생일을 등록합니다')
                .addIntegerOption(o =>
                    o.setName('월').setDescription('태어난 월 (1~12)').setRequired(true).setMinValue(1).setMaxValue(12)
                )
                .addIntegerOption(o =>
                    o.setName('일').setDescription('태어난 일').setRequired(true).setMinValue(1).setMaxValue(31)
                )
        )
        .addSubcommand(sub =>
            sub.setName('삭제').setDescription('등록된 생일을 삭제합니다')
        )
        .addSubcommand(sub =>
            sub.setName('조회').setDescription('내 등록된 생일을 확인합니다')
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const sub = interaction.options.getSubcommand();
        const birthdays = loadBirthdays();
        const userId = interaction.user.id;

        if (sub === '등록') {
            const month = interaction.options.getInteger('월');
            const day   = interaction.options.getInteger('일');

            if (day > MONTH_DAYS[month - 1]) {
                return interaction.editReply(`${month}월은 최대 ${MONTH_DAYS[month - 1]}일까지 있습니다.`);
            }

            birthdays[userId] = { month, day };
            saveBirthdays(birthdays);
            await interaction.editReply(`🎂 생일이 **${month}월 ${day}일** 로 등록됐습니다!`);

        } else if (sub === '삭제') {
            if (!birthdays[userId]) return interaction.editReply('등록된 생일이 없습니다.');
            delete birthdays[userId];
            saveBirthdays(birthdays);
            await interaction.editReply('🗑️ 생일 등록이 삭제됐습니다.');

        } else if (sub === '조회') {
            const b = birthdays[userId];
            if (!b) return interaction.editReply('등록된 생일이 없습니다. `/생일 등록` 으로 등록해주세요.');
            await interaction.editReply(`🎂 등록된 생일: **${b.month}월 ${b.day}일**`);
        }
    },
};
