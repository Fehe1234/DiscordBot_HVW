const fs = require('fs');
const path = require('path');

const profilesPath  = path.join(__dirname, '../data/profiles.json');
const worldsPath    = path.join(__dirname, '../data/worlds.json');
const reviewsPath   = path.join(__dirname, '../data/reviews.json');
const favoritesPath = path.join(__dirname, '../data/favorites.json');

const load = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const save = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');

const BADGES = [
    {
        id: 'first_profile',
        title: '🎮 VRChat 입문자',
        desc: '프로필을 처음 등록했습니다.',
        check: (userId, { profiles }) => !!profiles[userId],
    },
    {
        id: 'world_5',
        title: '🌍 월드 탐험가',
        desc: '월드를 5개 이상 등록했습니다.',
        check: (userId, { worlds }) => worlds.filter(w => w.registeredBy === userId).length >= 5,
    },
    {
        id: 'review_5',
        title: '📝 리뷰어',
        desc: '리뷰를 5개 이상 작성했습니다.',
        check: (userId, { reviews }) =>
            Object.values(reviews).reduce((n, list) => n + list.filter(r => r.userId === userId).length, 0) >= 5,
    },
    {
        id: 'favorite_10',
        title: '⭐ 컬렉터',
        desc: '즐겨찾기를 10개 채웠습니다.',
        check: (userId, { favorites }) => (favorites[userId]?.length ?? 0) >= 10,
    },
];

async function checkAndNotify(userId, client) {
    try {
        const profiles  = load(profilesPath);
        const profile   = profiles[userId];
        if (!profile) return;

        const data = {
            profiles,
            worlds:    load(worldsPath),
            reviews:   load(reviewsPath),
            favorites: load(favoritesPath),
        };

        if (!profile.unlockedBadges) profile.unlockedBadges = [];

        let newBadges = [];
        for (const badge of BADGES) {
            if (!profile.unlockedBadges.includes(badge.id) && badge.check(userId, data)) {
                profile.unlockedBadges.push(badge.id);
                newBadges.push(badge);
            }
        }

        if (newBadges.length > 0) {
            save(profilesPath, profiles);
            const user = await client.users.fetch(userId).catch(() => null);
            if (user) {
                const list = newBadges.map(b => `**${b.title}** — ${b.desc}`).join('\n');
                await user.send(
                    `🎉 새로운 칭호를 획득했습니다!\n\n${list}\n\n\`/칭호 설정\` 으로 적용할 수 있습니다.`
                ).catch(() => {});
            }
        }
    } catch {}
}

function getUnlockedBadges(userId) {
    try {
        const profiles = load(profilesPath);
        const unlocked = profiles[userId]?.unlockedBadges ?? [];
        return BADGES.filter(b => unlocked.includes(b.id));
    } catch { return []; }
}

module.exports = { checkAndNotify, getUnlockedBadges, BADGES };
