const jwt = require('jsonwebtoken');

const authMiddleWare = (req, res, next) => {
    const token = req.headers.token.split(' ')[1];

    if (!token) {
        return res.status(403).json({
            message: 'No token provided',
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, user) {
        if (err) {
            return res.status(401).json({
                message: 'Invalid token',
            });
        }

        if (user.role === 'Admin') {
            next();
        } else if (user.role === 'User') {
        } else {
            return res.status(404).json({
                message: 'The user is not authentication',
            });
        }
    });
};

module.exports = authMiddleWare;
