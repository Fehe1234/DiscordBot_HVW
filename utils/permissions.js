const OWNER_ID = '826036359499481109';
const ADMIN_ROLE_IDS = [
    '1464055831816437823', // 부관리자
    '1251157860340072548', // 가이드
];

const hasPermission = (member) => {
    return member.id === OWNER_ID
        || member.permissions.has('Administrator')
        || ADMIN_ROLE_IDS.some(id => member.roles.cache.has(id));
};

module.exports = { hasPermission };
