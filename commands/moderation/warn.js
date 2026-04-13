const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../../utils/permissions');
const fs = require('fs');
const path = require('path');

const WARN_LOG_CHANNEL_ID = '1383773094837223436';
const warningsPath = path.join(__dirname, '../../data/warnings.json');

const WARN_ROLES = {
    1: '1253665278655598633',
    2: '1253665397320978516',
    3: '1253665411338207292',
};
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const resolveTarget = async (input, guild) => {
    const id = input.replace(/[<@!>]/g, '').trim();
    try {
        return await guild.members.fetch(id);
    } catch {
        return null;
    }
};

const loadWarnings = () => {
    try {
        return JSON.parse(fs.readFileSync(warningsPath, 'utf-8'));
    } catch {
        return {};
    }
};

const saveWarnings = (data) => {
    fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2), 'utf-8');
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('경고')
        .setDescription('경고 관련 명령어')
        .addSubcommand(sub =>
            sub.setName('부여')
                .setDescription('사용자에게 경고를 부여합니다 (관리자 전용)')
                .addStringOption(option =>
                    option.setName('대상').setDescription('경고할 사용자 (멘션 또는 사용자 ID)').setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('사유').setDescription('경고 사유').setRequired(false)
                )
                .addAttachmentOption(option =>
                    option.setName('증거').setDescription('증거 이미지 (선택사항)').setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('초기화')
                .setDescription('사용자의 경고를 모두 초기화합니다 (관리자 전용)')
                .addStringOption(option =>
                    option.setName('대상').setDescription('초기화할 사용자 (멘션 또는 사용자 ID)').setRequired(true)
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const sub = interaction.options.getSubcommand();

        if (sub === '부여') {
            if (!hasPermission(interaction.member)) {
                return interaction.editReply('이 명령어를 사용할 권한이 없습니다.');
            }

            const input = interaction.options.getString('대상');
            const reason = interaction.options.getString('사유') ?? '사유 없음';
            const image = interaction.options.getAttachment('증거');
            const target = await resolveTarget(input, interaction.guild);

            if (!target) {
                return interaction.editReply('대상 사용자를 찾을 수 없습니다. 올바른 멘션 또는 사용자 ID를 입력해주세요.');
            }

            const warnings = loadWarnings();
            const userId = target.id;

            if (!warnings[userId]) warnings[userId] = [];

            warnings[userId].push({
                reason,
                moderator: interaction.user.id,
                timestamp: new Date().toISOString(),
            });
            saveWarnings(warnings);

            const count = warnings[userId].length;

            // 기존 경고 역할 전부 제거 후 현재 경고 횟수 역할 부여
            for (const roleId of Object.values(WARN_ROLES)) {
                if (target.roles.cache.has(roleId)) {
                    await target.roles.remove(roleId).catch(() => {});
                }
            }
            if (count <= 3 && WARN_ROLES[count]) {
                await target.roles.add(WARN_ROLES[count]).catch(err => console.error('역할 부여 실패:', err));
            }

            let actionMsg = '';

            if (count === 3) {
                // 7일 타임아웃
                await target.timeout(SEVEN_DAYS_MS, `경고 3회 누적 - ${reason}`).catch(err => console.error('타임아웃 실패:', err));
                actionMsg = '\n> 경고 3회 누적으로 **7일 타임아웃**이 적용됐습니다.';
            } else if (count >= 4) {
                // 영구 밴
                await interaction.editReply(`**${target.user.tag}** 님에게 경고를 부여했습니다. (누적 경고: **${count}회**)\n사유: ${reason}\n> 경고 4회 누적으로 **영구 밴** 처리합니다.`);
                await target.ban({ reason: `경고 4회 누적 - ${reason}` }).catch(err => console.error('밴 실패:', err));

                try {
                    const logChannel = await interaction.guild.channels.fetch(WARN_LOG_CHANNEL_ID);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('🔨 경고 4회 — 영구 밴')
                            .setColor(0xFF0000)
                            .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
                            .addFields(
                                { name: '대상', value: `${target.user.tag} (<@${target.id}>)`, inline: true },
                                { name: '담당자', value: `<@${interaction.user.id}>`, inline: true },
                                { name: '누적 경고', value: `${count}회`, inline: true },
                                { name: '사유', value: reason },
                            )
                            .setTimestamp();
                    if (image) embed.setImage(image.url);
                        await logChannel.send({ embeds: [embed] });
                    }
                } catch (err) {
                    console.error('경고 로그 채널 전송 실패:', err);
                }
                return;
            }

            await interaction.editReply(`**${target.user.tag}** 님에게 경고를 부여했습니다. (누적 경고: **${count}회**)\n사유: ${reason}${actionMsg}`);

            try {
                const logChannel = await interaction.guild.channels.fetch(WARN_LOG_CHANNEL_ID);
                if (logChannel) {
                    const titleMap = {
                        1: '⚠️ 경고 1회',
                        2: '⚠️ 경고 2회',
                        3: '⏱️ 경고 3회 — 7일 타임아웃',
                    };
                    const embed = new EmbedBuilder()
                        .setTitle(titleMap[count] ?? `⚠️ 경고 ${count}회`)
                        .setColor(count === 3 ? 0xFF4500 : 0xFFA500)
                        .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
                        .addFields(
                            { name: '대상', value: `${target.user.tag} (<@${target.id}>)`, inline: true },
                            { name: '담당자', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '누적 경고', value: `${count}회`, inline: true },
                            { name: '사유', value: reason },
                        )
                        .setTimestamp();
                    if (image) embed.setImage(image.url);
                    await logChannel.send({ embeds: [embed] });
                }
            } catch (err) {
                console.error('경고 로그 채널 전송 실패:', err);
            }
        }

        else if (sub === '초기화') {
            if (!hasPermission(interaction.member)) {
                return interaction.editReply('이 명령어를 사용할 권한이 없습니다.');
            }

            const input = interaction.options.getString('대상');
            const target = await resolveTarget(input, interaction.guild);

            if (!target) {
                return interaction.editReply('대상 사용자를 찾을 수 없습니다. 올바른 멘션 또는 사용자 ID를 입력해주세요.');
            }

            const warnings = loadWarnings();
            const prev = warnings[target.id]?.length ?? 0;
            delete warnings[target.id];
            saveWarnings(warnings);

            // 경고 역할 모두 제거
            for (const roleId of Object.values(WARN_ROLES)) {
                if (target.roles.cache.has(roleId)) {
                    await target.roles.remove(roleId).catch(() => {});
                }
            }

            await interaction.editReply(`**${target.user.tag}** 님의 경고 **${prev}회**를 초기화했습니다.`);

            try {
                const logChannel = await interaction.guild.channels.fetch(WARN_LOG_CHANNEL_ID);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🗑️ 경고 초기화')
                        .setColor(0x808080)
                        .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
                        .addFields(
                            { name: '대상', value: `${target.user.tag} (<@${target.id}>)`, inline: true },
                            { name: '담당자', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '초기화된 경고', value: `${prev}회`, inline: true },
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [embed] });
                }
            } catch (err) {
                console.error('경고 초기화 로그 채널 전송 실패:', err);
            }
        }
    },
};
