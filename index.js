require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, MessageFlags, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const STATUS_CHANNEL_ID = '1383773094837223436';
const ONLINE_CHANNEL_ID = '1493282040815288443';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
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
