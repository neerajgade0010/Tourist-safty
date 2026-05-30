import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateTouristId, registerOnBlockchain } from "../utils/blockchain.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    // get data from frontend request
    //  body -->
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // 10 is the salt round more the value more secire but slow 
    const hashedPassword = await bcrypt.hash(password, 10);
    const touristId = generateTouristId(email);

    const user = await User.create({
      name: name?.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      touristId,
    });

    // Register on blockchain asynchronously — don't block the response
    setImmediate(async () => {
      const result = await registerOnBlockchain(touristId, email.toLowerCase());
      if (result) {
        await User.findByIdAndUpdate(user._id, {
          blockchainTxHash: result.txHash,
          blockchainRegistered: true,
        });
        console.log(`✅ Blockchain registered: ${touristId} | tx: ${result.txHash}`);
      }
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { email: user.email, role: user.role, touristId },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        touristId: user.touristId,
        blockchainRegistered: user.blockchainRegistered,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
};
