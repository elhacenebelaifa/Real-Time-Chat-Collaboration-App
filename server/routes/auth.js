const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
    try {
        const { username, email, password, displayName, publicKey } = req.body;

        if (!username || !email || !password) {
            return res
                .status(400)
                .json({
                    error: {
                        message: "Username, email, and password are required"
                    }
                });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({
                    error: { message: "Password must be at least 6 characters" }
                });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            const field = existingUser.email === email ? "Email" : "Username";
            return res
                .status(409)
                .json({ error: { message: `${field} already taken` } });
        }

        const user = new User({
            username,
            email,
            passwordHash: password,
            displayName: displayName || username,
            publicKey: publicKey || ""
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({ token, user: user.toJSON() });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({
                    error: { message: "Email and password are required" }
                });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(401)
                .json({ error: { message: "Invalid credentials" } });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res
                .status(401)
                .json({ error: { message: "Invalid credentials" } });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, user: user.toJSON() });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => {
    res.json({ user: req.user.toJSON() });
});

module.exports = router;
