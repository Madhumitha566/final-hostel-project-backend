import User from './models/User.js';
import bcrypt from 'bcryptjs';
import connecttodb from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const registerUser = async (name, email, password, role) => {
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log(`User ${email} already exists...`);
            return;
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashPassword,
            role
        });

        await newUser.save();
        console.log(`${role} (${name}) registered successfully!`);
    } catch (err) {
        console.error(`Error seeding ${email}:`, err.message);
    }
};

const setupUsers = async () => {
    try {
      
        await connecttodb();
        console.log("Connected to database for seeding...");

        await registerUser("System Admin", "admin@gmail.com", "admin123", "Admin");
        await registerUser("Staff Member 1", "staff1@gmail.com", "staff123", "Staff");
        await registerUser("Staff Member 2", "staff2@gmail.com", "staff456", "Staff");
        await registerUser("Staff Member 3", "staff3@gmail.com", "staff789", "Staff");

        console.log(" Seeding process finished ");
        process.exit(0);
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

setupUsers();