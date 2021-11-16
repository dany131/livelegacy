const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require("express-rate-limit");
const cors = require('cors');
const app = express();

//  Request Rate Limiter
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minutes
    max: 60 // limit each IP to 60 requests per windowMs
});

// Middle wares
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Our data can have strings, arrays, objects etc.
// app.use(express.static('images'));
const PORT = process.env.PORT || 4000;

// Environment variable 
require('dotenv').config();

// User Routes
const userRoute = require('./routes/users/user');
const userManageProfileRoute = require('./routes/users/manageProfile');
const userUploadsRoute = require('./routes/users/uploads');
const userCreateMeetingRoute = require('./routes/users/meetings');

// Admin Routes
const adminAuth = require('./routes/admin/auth');
const adminUserManagement = require('./routes/admin/userManagement');
const adminUploadsManagement = require('./routes/admin/uploadsManagement');
const adminMeetingsManagement = require('./routes/admin/meetingsManagement');

app.use('/api/user', userRoute);
app.use('/api/user/manage-profile', userManageProfileRoute);
app.use('/api/user/uploads', userUploadsRoute);
app.use('/api/user/meetings', userCreateMeetingRoute);
app.use('/api/admin/auth', adminAuth);
app.use('/api/admin/user-management', adminUserManagement);
app.use('/api/admin/uploads-management', adminUploadsManagement);
app.use('/api/admin/meetings-management', adminMeetingsManagement);

// Contact Us Route
const contactUsRoute = require('./routes/contactus');
app.use('/api/contact-us', contactUsRoute);

// Connection to mongo atlas 
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("Connected to Mongo");
}).catch(error => {
    console.log("Something wrong happened", error);
});

app.listen(PORT, () => {
    console.log("Server started at port", PORT);
})

// Will catch any uncaught exeption. 
process.on('uncaughtException', function (error) {
    console.log(error);
});

// This is comment is to test the git 