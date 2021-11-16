const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../../models/admin");
const bcrypt = require("bcrypt");

// Sign up
router.post("/signup", async (req, res) => {
    try {
        if (!req.body.userName || !req.body.password) {
            res.status(400).json({ message: "Fields are required", data: null });
            return;
        }
        const admin = new Admin({
            userName: req.body.userName,
            password: req.body.password

        });
        // To check if username exists in db 
        const userNameExists = await Admin.findOne({ userName: admin.userName });
        if (userNameExists) {
            res.status(400).json({ message: "User Name Already Exists", data: null });
            return;
        }
        if (req.body.password.length < 7) {
            res.status(400).json({ message: "Password length must be at least 7 characters", data: null });
            return;
        }
        //salt to hash password
        const salt = await bcrypt.genSalt(10);
        //user password to hashed password
        admin.password = await bcrypt.hash(admin.password, salt);
        const adminResponse = await admin.save();
        res.status(200).json({ message: "Success", data: adminResponse });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong", data: null });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const body = req.body;
        if (!body.userName || !body.password) {
            res.status(400).json({ message: "Fields are required", data: null });
            return;
        }
        const admin = await Admin.findOne({ userName: body.userName });
        if (admin) {
            // checking user password with hashed password stored in the database
            const validPassword = await bcrypt.compare(body.password, admin.password);
            if (validPassword) {
                var token = jwt.sign(
                    { admin },
                    process.env.JWT_KEY,
                    { expiresIn: "1h" });
                res.status(200).json({ message: "Login successfully", data: { admin: admin, token: token } });
                return;
            } else {
                res.status(400).json({ message: "Invalid Password", data: null });
                return;
            }
        } else {
            res.status(401).json({ message: "User does not exist", data: null });
            return;
        }
    }
    catch (error) {
        res.status(500).json({ message: "Something went wrong", data: null });
        return;
    }
});

module.exports = router;





