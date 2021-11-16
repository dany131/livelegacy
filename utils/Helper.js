const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const multer = require("multer");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const Meetings = require("../models/meetings");

// Code Generator
function randomString(length) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var result = '';
    for (var i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// Maling function
async function sendEmail(email, subject, username, text) {
    const filePath = path.join(__dirname, '/templates/email.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
        username: username,
        text: text
    };
    const htmlToSend = template(replacements);
    let transporter = nodemailer.createTransport({
        host: "mail.live-legacy.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "no-reply@live-legacy.com", // generated ethereal user
            pass: "C1HVFFPhEdEE", // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    const mailOptions = {
        from: '"Live Legacy" no-reply@live-legacy.com',
        to: email,
        subject: subject,
        attachments: [{
            filename: 'logo.png',
            path: __dirname + '/templates/logo.png',
            cid: 'logoImage'
        }],
        html: htmlToSend
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
}

// Video uploads
const videoStorage = multer.diskStorage({
    destination: process.env.VIDEO_PATH, // Destination to store video 
    filename: (req, file, cb) => {
        cb(null, nanoid()
            + path.extname(file.originalname))
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: {
        fileSize: 50000000 // 10000000 Bytes = 10 MB
    },
    fileFilter(req, file, cb) {
        // upload only mp4 and mkv format
        if (!file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)) {
            return cb(new Error('File type not supported (Supported types are mp4, MPEG-4, mkv)'));
        }
        cb(undefined, true)
    }
});

// JWT Generator
function generateJwt() {
    const payload = {
        "iss": process.env.ZOOM_API_KEY,
        "exp": 600000000000   // In miliseconds
    }
    const token = jwt.sign(payload, process.env.ZOOM_API_SECRET, { algorithm: 'HS256' });
    return token;
}

// Validate ISO date format
function isISODateFormat(date) {
    return /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)/.test(date);
}

// Send mail for meeting
async function sendEmailMeeting(email, subject, username, text) {
    const filePath = path.join(__dirname, '/templates/emailMeeting.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
        username: username,
        text: text
    };
    const htmlToSend = template(replacements);
    let transporter = nodemailer.createTransport({
        host: "mail.live-legacy.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "no-reply@live-legacy.com", // generated ethereal user
            pass: "C1HVFFPhEdEE", // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    const mailOptions = {
        from: '"Live Legacy" no-reply@live-legacy.com',
        to: email,
        subject: subject,
        attachments: [{
            filename: 'logo.png',
            path: __dirname + '/templates/logo.png',
            cid: 'logoImage'
        }],
        html: htmlToSend
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
}

// Send mail for contact us
async function sendEmailContactUs(email, subject, name, userEmail, phone, company, message) {
    const filePath = path.join(__dirname, '/templates/emailContactus.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
        name: name,
        email: userEmail,
        phone: phone,
        company: company,
        message: message
    };
    const htmlToSend = template(replacements);
    let transporter = nodemailer.createTransport({
        host: "mail.live-legacy.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "no-reply@live-legacy.com", // generated ethereal user
            pass: "C1HVFFPhEdEE", // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    const mailOptions = {
        from: '"Live Legacy" no-reply@live-legacy.com',
        to: email,
        subject: subject,
        attachments: [{
            filename: 'logo.png',
            path: __dirname + '/templates/logo.png',
            cid: 'logoImage'
        }],
        html: htmlToSend
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
}

// Check if date is in the past
function dateInPast(firstDate, secondDate) {
    if (firstDate.setHours(0, 0, 0, 0) < secondDate.setHours(0, 0, 0, 0)) {
        return true;
    }
    return false;
}

// Check meeting clash
async function dateTimeValidation(ISODate) {
    // Check if time is in given range
    // Times provided by client
    const timeAvailable = ["09:00", "10:00", "11:00", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30"];
    const time = ISODate.split("T");
    const timeArray = time[1].split(":");
    const secondlessTime = `${timeArray[0]}:${timeArray[1]}`;
    let isValidTime = false;
    for (let i = 0; i < timeAvailable.length; i++) {
        if (secondlessTime.localeCompare(timeAvailable[i]) === 0) {
            isValidTime = true;
            break;
        }
    }
    if (!isValidTime) {
        return false;
    }
    // If date is in past
    // const userDate = new Date(time[0]);
    // const today = new Date();
    // if (dateInPast(userDate, today)) {
    //     return false;
    // }
    // If time already exists in db, return false
    const meetings = await Meetings.find({ startTime: ISODate });
    if (meetings.length > 0) {
        return false;
    }
    return true;
}

module.exports = { randomString, sendEmail, videoUpload, generateJwt, isISODateFormat, sendEmailMeeting, sendEmailContactUs, dateTimeValidation };