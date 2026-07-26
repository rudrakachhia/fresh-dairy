const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                error: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error registering user"
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        req.session.userId = user._id;

        res.json({
            message: "Logged in successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error logging in"
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {

        if (err) {
            return res.status(500).json({
                error: "Error logging out"
            });
        }

        res.json({
            message: "Logged out successfully"
        });

    });
};

exports.checkAuth = async (req, res) => {
    try {

        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(401).json({
                isAuthenticated: false
            });
        }

        res.json({
            isAuthenticated: true,
            email: user.email
        });

    } catch (error) {

        res.status(500).json({
            error: "Error checking authentication"
        });

    }
};
