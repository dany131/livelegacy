const express = require('express');
const router = express.Router();
const helper = require('../utils/Helper');
const LIVELEGACYEMAIL = "info@live-legacy.com";

// Contact us
router.post('/send-mail', async (req, res) => {
    try {
        const { name, email, phone, company, message } = req.body;
        if (!name, !email, !phone, !company, !message) {
            res.status(400).json({ message: "Fields are required" });
            return;
        }
        helper.sendEmailContactUs(LIVELEGACYEMAIL, "Contact Us", name, email, phone, company, message);
        res.status(200).json({ message: "Form submitted successfully" });
        return;
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        return;
    }
});

module.exports = router;