import { Router, Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface User {
  _id: string;
  email: string;
  password: string;
  role: string;
}

// Login API
router.post("/api/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = (await User.findOne({ username })) as User;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key"
    );

    res.json({
      token,
      role: user.role,
      userId: user._id.toString(),
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// Signup API
router.post("/api/signup", async (req: Request, res: Response) => {
  const { username, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed password
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      userId: newUser._id,
      role: newUser.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export { router as authRouter };
