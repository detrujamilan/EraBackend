const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.user.id);
        next(); // Proceed to the next middleware/route
    } catch (err) {
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = {protect};
