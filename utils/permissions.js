const ADMIN_ROLE_ID = '1251157860340072548';
const OWNER_ID = '826036359499481109';

const hasPermission = (member) => {
    return member.id === OWNER_ID
        || member.permissions.has('Administrator')
        || member.roles.cache.has(ADMIN_ROLE_ID);
};

module.exports = { hasPermission };
