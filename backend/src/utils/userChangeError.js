function userChangeError(actorId, target, next) {
    if (Number(actorId) === Number(target.idUser) && Number(next.active) !== 1) {
        return 'You cannot deactivate your own user.';
    }
    const wasAdmin = Number(target.active) === 1 && target.code === 'ADM';
    const staysAdmin = Number(next.active) === 1 && next.code === 'ADM';
    if (wasAdmin && !staysAdmin && next.otherActiveAdmins < 1) {
        return 'The account needs at least one active administrator.';
    }
    return '';
}

module.exports = { userChangeError };
