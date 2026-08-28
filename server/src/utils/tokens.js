const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };
