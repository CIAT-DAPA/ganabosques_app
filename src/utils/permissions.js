export function hasPermission(userDb, action, option) {
    if (!userDb) return false;
    if (userDb.admin) return true;
    return userDb.permissions?.some(permission =>
        permission.action === action &&
        permission.options.includes(option)
    ) ?? false;
}