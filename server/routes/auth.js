import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


const router = express.Router();


const signToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });


// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, contact,email, password } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already in use' });
        const user = await User.create({ name, email, password });
        const token = signToken(user);
        res.status(200).json({ message:"Sign up successfully",user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }, token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Login
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const match = await user.comparePassword(password);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });
        const token = signToken(user);
        res.json({ message:`Welcome back ${user.name}`,user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }, token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


export default router;