import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Extract token from Headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token, authorization denied' });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Token verification failed' });
        }

        // 3. Fetch Full User Data based on the Role in the token
        let user;
        if (decoded.role === "Resident") {
            // If the role is Resident, search the Tenant collection
            user = await Tenant.findById(decoded._id).select('-password').populate('currentRoom');
        } else {
            // Otherwise, search the internal User collection (Admin/Staff)
            user = await User.findById(decoded._id).select('-password');
        }

        // 4. Handle User Not Found
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 5. Attach user object (with all fields like phone, amount, etc.) and role
        // We add the role explicitly just in case it's not in the DB document
        req.user = { ...user._doc, role: decoded.role }; 
        
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

export default authMiddleware;