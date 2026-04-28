const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const NITRO_ROLE_ID = '1267802236843593862';
const FREE_ROLE_IDS = ['1464055831816437823', '1251157860340072548'];
const hasAccess = (member) =>
    member.roles.cache.has(NITRO_ROLE_ID) || FREE_ROLE_IDS.some(id => member.roles.cache.has(id));

const worldsPath    = path.join(__dirname, '../../data/worlds.json');
const favoritesPath = path.join(__dirname, '../../data/favorites.json');
const loadWorlds    = () => JSON.parse(fs.readFileSync(worldsPath, 'utf-8'));
const loadFavorites = () => JSON.parse(fs.readFileSync(favoritesPath, 'utf-8'));
const saveFavorites = (d) => fs.writeFileSync(favoritesPath, JSON.stringify(d, null, 2), 'utf-8');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('즐겨찾기')
        .setDescription('월드 즐겨찾기를 관리합니다 (니트로 전용)')
        .addSubcommand(sub =>
            sub.setName('추가')
                .setDescription('월드를 즐겨찾기에 추가합니다')
                .addStringOption(o => o.setName('월드').setDescription('월드 이름').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('삭제')
                .setDescription('즐겨찾기에서 월드를 제거합니다')
                .addStringOption(o => o.setName('월드').setDescription('월드 이름').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('목록')
                .setDescription('내 즐겨찾기 목록을 확인합니다')
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!hasAccess(interaction.member)) {
            return interaction.editReply('이 명령어는 니트로 유저만 사용할 수 있습니다.');
        }

        const sub = interaction.options.getSubcommand();
        const favorites = loadFavorites();
        const userId = interaction.user.id;
        if (!favorites[userId]) favorites[userId] = [];

        if (sub === '추가') {
            const query = interaction.options.getString('월드').toLowerCase();
            const world = loadWorlds().find(w => w.name.toLowerCase().includes(query));
            if (!world) return interaction.editReply('해당 월드를 찾을 수 없습니다.');
            if (favorites[userId].includes(world.id)) return interaction.editReply('이미 즐겨찾기에 추가된 월드입니다.');
            if (favorites[userId].length >= 10) return interaction.editReply('즐겨찾기는 최대 10개까지 가능합니다.');

            favorites[userId].push(world.id);
            saveFavorites(favorites);
            await interaction.editReply(`⭐ **${world.name}** 을(를) 즐겨찾기에 추가했습니다.`);

        } else if (sub === '삭제') {
            const query = interaction.options.getString('월드').toLowerCase();
            const world = loadWorlds().find(w => w.name.toLowerCase().includes(query));
            if (!world) return interaction.editReply('해당 월드를 찾을 수 없습니다.');
            const idx = favorites[userId].indexOf(world.id);
            if (idx === -1) return interaction.editReply('즐겨찾기에 없는 월드입니다.');

            favorites[userId].splice(idx, 1);
            saveFavorites(favorites);
            await interaction.editReply(`🗑️ **${world.name}** 을(를) 즐겨찾기에서 제거했습니다.`);

        } else if (sub === '목록') {
            if (!favorites[userId].length) return interaction.editReply('즐겨찾기에 추가된 월드가 없습니다.');

            const worlds = loadWorlds();
            const lines = favorites[userId].map((id, i) => {
                const w = worlds.find(w => w.id === id);
                return w ? `**${i + 1}.** [${w.name}](${w.link}) · ${w.genre}` : `**${i + 1}.** *(삭제된 월드)*`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`⭐ ${interaction.user.username} 의 즐겨찾기`)
                .setDescription(lines)
                .setColor(0xFFC83D)
                .setFooter({ text: `${favorites[userId].length} / 10` });
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
