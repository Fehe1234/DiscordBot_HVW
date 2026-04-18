require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, MessageFlags, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const STATUS_CHANNEL_ID = '1383773094837223436';
const ONLINE_CHANNEL_ID = '1493282040815288443';

const WELCOME_CHANNEL_ID = '1240378733618135204';
const RULES_CHANNEL_ID   = '1240377977686986856';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// 커맨드 동적 로드
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

client.once(Events.ClientReady, async (c) => {
    console.log(`봇 준비 완료: ${c.user.tag}`);
    console.log(`커맨드 ${client.commands.size}개 로드됨`);

    const statuses = [
        { name: 'HVW 24시간 가동 중', type: ActivityType.Watching },
        { name: '페헤님 곁을 지키는 고양이 🐱', type: ActivityType.Playing },
    ];
    let statusIndex = 0;

    const updateStatus = () => {
        c.user.setPresence({ activities: [statuses[statusIndex]], status: 'online' });
        statusIndex = (statusIndex + 1) % statuses.length;
    };

    updateStatus();
    setInterval(updateStatus, 5_000);

    const channel = await c.channels.fetch(ONLINE_CHANNEL_ID).catch(() => null);
    if (channel) {
        const embed = new EmbedBuilder()
            .setTitle('✅ 봇 온라인')
            .setDescription('봇이 정상적으로 시작됐습니다.')
            .setColor(0x57F287)
            .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(() => {});
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    if (member.user.bot) return;

    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle('🌍 새로운 멤버가 들어왔어요!')
        .setDescription(
            `${member} 님, **Hello! VRChat World!** 에 오신 걸 환영합니다! 🎉\n\n` +
            `먼저 <#${RULES_CHANNEL_ID}> 채널을 꼭 확인해주세요.\n` +
            `앞으로 즐거운 커뮤니티 활동 되시길 바랍니다 😊`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x5865F2)
        .setFooter({ text: `${member.guild.name}` })
        .setTimestamp();

    await channel.send({ content: `${member}`, embeds: [embed] }).catch(console.error);
});

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        const msg = { content: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', flags: MessageFlags.Ephemeral };
        interaction.replied || interaction.deferred
            ? await interaction.followUp(msg).catch(() => {})
            : await interaction.reply(msg).catch(() => {});
    }
});

client.on('error', (err) => {
    console.error('클라이언트 오류:', err);
});

// 봇 종료 시 알림
const shutdown = async (signal) => {
    console.log(`${signal} 수신 — 봇 종료 중...`);
    try {
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('🔴 봇 오프라인')
                .setDescription('봇이 오프라인 상태입니다. 명령어를 사용할 수 없습니다.')
                .setColor(0xED4245)
                .setTimestamp();
            await channel.send({ embeds: [embed] }).catch(() => {});
        }
    } finally {
        client.destroy();
        process.exit(0);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

client.login(process.env.DISCORD_TOKEN);
