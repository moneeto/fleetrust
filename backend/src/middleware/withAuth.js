const jwt = require('jsonwebtoken');
const secret = process.env.SECRET_STRING;

const withAuth = function (req, res, next) {

    const token = req.cookies.token;
    if (!token) {
        res.status(401)
        res.send(JSON.parse('{ "status": "error", "message": "Unauthorized: No token provided"}'));
    } else {
        jwt.verify(token, secret, function (err, decoded) {
            if (err) {
                res.status(401)
                res.send(JSON.parse('{ "status": "error", "message": "Unauthorized: Invalid token"}'))
            } else {
                req.idUser = decoded.idUser;
                req.username = decoded.username;
                req.idRole = decoded.idRole;
                req.name = decoded.name;
                req.active = decoded.active;
                next();
            }
        });
    }
}

module.exports = withAuth;