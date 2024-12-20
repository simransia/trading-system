import { Router } from "express";
import User from "../models/User";
const router = Router();
// Login API
router.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.status(200).json({ role: user.role, userId: user._id });
        }
        else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});
// Signup API
router.post("/api/signup", async (req, res) => {
    const { username, password, role } = req.body;
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        // Create a new user
        const newUser = new User({ username, password, role });
        await newUser.save();
        res
            .status(201)
            .json({ message: "User created successfully", userId: newUser._id });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});
export { router as authRouter };
