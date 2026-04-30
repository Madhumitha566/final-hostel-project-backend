import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Search for Admin/Staff in User collection
        let account = await User.findOne({ email });
        let type = 'internal';

        // 2. If not found, search for Resident in Tenant collection
        if (!account) {
            account = await Tenant.findOne({ email }).populate('currentRoom');
            type = 'tenant';
        }

        // 3. If neither found
        if (!account) {
            return res.status(404).json({ success: false, error: "Account not found" });
        }

        // 4. Validate Password
        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Wrong Password" });
        }

        // 5. Determine Role
        const userRole = type === 'tenant' ? "Resident" : account.role;

        // 6. Generate Token
        const token = jwt.sign(
            { _id: account._id, role: userRole },
             process.env.JWT_SECRET_KEY,
            { expiresIn: "10d" }
        );

        // 7. Construct Base User Object
        const userData = {
            _id: account._id,
            name: account.name,
            email: account.email,
            role: userRole,
        };

        // 8. Add Tenant-specific data if applicable
        if (type === 'tenant') {
            userData.phone = account.phone;
            userData.emergencyContact = account.emergencyContact;
            userData.amount = account.amount;
            userData.status = account.status;
            userData.checkInDate = account.checkInDate;
            userData.checkOutDate = account.checkOutDate;
            if (account.currentRoom) {
               userData.currentRoom = {
                roomnumber: account.currentRoom.roomnumber
              };
    }
        }

        // 9. Send Response
        res.status(200).json({
            success: true,
            token,
            user: userData,
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const verify = (req, res) => {
    if (req.user) {
        return res.status(200).json({ success: true, user: req.user });
    }
    return res.status(401).json({ success: false, error: "User not authenticated" });
};

export { login, verify };