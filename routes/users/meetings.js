const express = require('express');
const router = express.Router();
const helper = require("../../utils/Helper");
const rp = require('request-promise');
const Meeting = require('../../models/meetings');

// Create zoom meeting
router.post("/create-meeting", async (req, res) => {
    try {
        const { name, email, topic, startTime, agenda } = req.body;
        if (!name || !email || !topic || !startTime || !agenda) {
            res.status(400).json({ message: "Fields are required" });
            return;
        }
        if (agenda.length > 2000) {
            res.status(400).json({ message: "Agenda can be maximum 2,000 characters" });
            return;
        }
        if (!helper.isISODateFormat(startTime)) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }
        let isValidDateTime;
        await helper.dateTimeValidation(startTime).then((result) => {
            isValidDateTime = result;
        });
        if (!isValidDateTime) {
            res.status(400).json({ message: "Can't create meeting for this slot. Please choose another slot" });
            return;
        }
        const options = {
            method: "POST",
            uri: "https://api.zoom.us/v2/users/" + process.env.ZOOM_EMAIL + "/meetings",
            body: {
                topic: topic,
                type: 2,
                start_time: startTime,
                duration: 60,  // Meeting duration in minutes
                agenda: agenda, // Max length 2,000 characters
                settings: {
                    host_video: "true",
                    participant_video: "true",
                    join_before_host: false
                }
            },
            auth: {
                bearer: helper.generateJwt()
            },
            headers: {
                "User-Agent": "Zoom-api-Jwt-Request",
                "content-type": "application/json"
            },
            json: true //Parse the JSON string in the response
        };

        rp(options)
            .then(function (response) {
                // Store meeting object
                const meeting = new Meeting({
                    userName: name,
                    userEmail: email,
                    topic: response.topic,
                    startTime: response.start_time,
                    agenda: response.agenda,
                    startUrl: response.start_url,
                    joinUrl: response.join_url,
                    hostId: response.host_id,
                    hostEmail: response.host_email,
                    timezone: response.timezone,
                    password: response.password
                }).save();
                // Send meeting link to the user's email
                let dateTimeArray = response.start_time.split("T");
                let date = dateTimeArray[0];
                let time = dateTimeArray[1];
                var onlyTime = time.slice(0, -1);
                helper.sendEmailMeeting(email, "Meeting Link", name, `Please use this meeting link to join on ${date} at ${onlyTime}, Meeting Link: ${response.join_url} `);
                res.status(200).json({ message: "Meeting created successfully, Please check your email address for more information" });
                return;
            })
            .catch(function (err) {
                // API call failed...
                console.log("API call failed, reason ", err);
                res.status(400).json({ message: "Sorry, we can't schedule a meeting at this time, Please try again later" });
                return;
            });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
        return;
    }
});


module.exports = router;