const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const CATEGORIES = {
    general: {
        label: '📋 일반',
        commands: [
            { name: '/핑', desc: '봇 응답 지연시간 확인' },
            { name: '/유저정보 [유저]', desc: '디스코드 유저 정보 조회' },
            { name: '/신고', desc: '관리자에게 신고 접수 (5시간 쿨타임)' },
            { name: '/피드백', desc: '관리자에게 피드백 전달 (1시간 쿨타임)' },
            { name: '/도움말', desc: '봇 명령어 목록 확인' },
            { name: '/페헤', desc: '서버 운영자 페헤님 소개' },
            { name: '/yohan', desc: '요한님 소개' },
        ],
    },
    announce: {
        label: '📢 공지 (관리자)',
        commands: [
            { name: '/공지설정', desc: '기본 공지 채널 설정' },
            { name: '/공지', desc: '제목·내용·채널·이미지·멘션 포함 공지 전송' },
            { name: '/공지채널', desc: '임베드 형식으로 공지 전송 (채널 고정)' },
        ],
    },
    moderation: {
        label: '🔨 관리 (관리자)',
        commands: [
            { name: '/경고 부여', desc: '유저에게 경고 부여 (누적 시 자동 제재)' },
            { name: '/경고 초기화', desc: '유저 경고 전체 초기화' },
            { name: '/밴', desc: '유저 영구 밴' },
            { name: '/킥', desc: '유저 추방' },
            { name: '/채팅청소', desc: '메시지 일괄 삭제' },
        ],
    },
    music: {
        label: '🎵 음악',
        commands: [
            { name: '/노래재생 [URL/검색어]', desc: 'YouTube 음악 재생 또는 대기열 추가' },
            { name: '/노래스킵', desc: '현재 곡 건너뛰기' },
            { name: '/노래일시정지', desc: '재생 일시정지' },
            { name: '/노래재개', desc: '일시정지 해제' },
            { name: '/노래반복', desc: '반복 모드 설정 (없음/현재곡/전체)' },
            { name: '/노래대기열', desc: '현재 대기열 확인' },
            { name: '/통화방퇴장', desc: '봇 음성 채널 퇴장' },
        ],
    },
    world: {
        label: '🌐 월드',
        commands: [
            { name: '/월드등록', desc: 'VRChat 월드 등록 (일반 6h / 니트로 1h 쿨타임)' },
            { name: '/월드목록', desc: '등록된 월드 목록 확인 (◀ ▶ 페이지)' },
            { name: '/월드조회 [이름]', desc: '월드 이름으로 검색' },
            { name: '/월드삭제 [이름]', desc: '본인이 등록한 월드 삭제' },
            { name: '/월드홍보무료 등록', desc: 'VRChat 월드를 7일간 홍보 채널에 등록' },
            { name: '/월드홍보무료 갱신', desc: '등록된 홍보를 7일 연장 (문구 변경 가능)' },
            { name: '/월드홍보무료 삭제', desc: '등록된 홍보 삭제' },
        ],
    },
    profile: {
        label: '👤 프로필',
        commands: [
            { name: '/프로필등록 💎', desc: 'VRChat 프로필 등록 (니트로 전용)' },
            { name: '/프로필 [유저]', desc: '타인 VRChat 프로필 조회' },
            { name: '/프로필삭제', desc: '내 프로필 삭제' },
        ],
    },
    nitro: {
        label: '💎 니트로 전용',
        commands: [
            { name: '/내정보', desc: '내 Discord + VRChat 프로필 통합 조회' },
            { name: '/월드정보 [이름]', desc: '월드 상세 정보 조회' },
            { name: '/월드리뷰 작성/조회/삭제', desc: '월드 별점 및 리뷰 관리' },
            { name: '/즐겨찾기 추가/삭제/목록', desc: '월드 즐겨찾기 관리 (최대 10개)' },
            { name: '/랜덤월드 [장르]', desc: '랜덤 월드 추천' },
            { name: '/생일 등록/삭제/조회', desc: '생일 등록 → 당일 자동 축하' },
            { name: '/칭호 설정/삭제/목록', desc: '닉네임 칭호 설정 및 뱃지 목록 확인' },
        ],
    },
};

const buildEmbed = (key) => {
    const cat = CATEGORIES[key];
    const lines = cat.commands.map(c => `\`${c.name}\`\n└ ${c.desc}`).join('\n\n');
    return new EmbedBuilder()
        .setTitle(`HVW Bot 도움말 — ${cat.label}`)
        .setDescription(lines)
        .setColor(0x5865F2)
        .setFooter({ text: '💎 표시는 니트로 / 부관리자 / 가이드 전용' })
        .setTimestamp();
};

const buildMenu = (current) =>
    new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('카테고리 선택')
            .addOptions(
                Object.entries(CATEGORIES).map(([key, cat]) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(cat.label)
                        .setValue(key)
                        .setDefault(key === current)
                )
            )
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('도움말')
        .setDescription('봇 명령어 목록을 확인합니다'),

    async execute(interaction) {
        await interaction.deferReply();

        const defaultKey = 'general';
        const msg = await interaction.editReply({
            embeds: [buildEmbed(defaultKey)],
            components: [buildMenu(defaultKey)],
        });

        const collector = msg.createMessageComponentCollector({ time: 120_000 });

        collector.on('collect', async (sel) => {
            await sel.deferUpdate();
            const key = sel.values[0];
            await interaction.editReply({
                embeds: [buildEmbed(key)],
                components: [buildMenu(key)],
            });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};
