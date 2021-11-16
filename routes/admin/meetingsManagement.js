const express = require('express');
const router = express.Router();
const helper = require("../../utils/Helper");
const Meeting = require('../../models/meetings');

// Get all meetings
router.get("/meetings", (req, res) => {
    Meeting.find().then(async (meetings) => {
        res.status(200).json({ message: "All meetings", data: meetings });
        return;
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong", data: null });
    });
});

// Get upcoming meetings
router.get("/upcoming-meetings", (req, res) => {
    Meeting.find().then(async (meetings) => {
        let data = [];
        if (meetings.length > 0) {
            for (let i = 0; i < meetings.length; i++) {
                meetingDate = new Date(meetings[i]._doc.startTime);
                if (Date.parse(meetingDate) > Date.parse(new Date())) {
                    data.push(meetings[i]);
                }
            }
        }
        res.status(200).json({ message: "All upcoming meetings", data: data });
        return;
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong", data: null });
    });
});
module.exports = router;