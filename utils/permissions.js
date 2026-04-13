const ADMIN_ROLE_ID = '1251157860340072548';

const hasPermission = (member) => {
    return member.permissions.has('Administrator') || member.roles.cache.has(ADMIN_ROLE_ID);
};

module.exports = { hasPermission };
