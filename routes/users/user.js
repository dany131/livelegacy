const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../../utils/auth");
const User = require("../../models/user");
const helper = require("../../utils/Helper");
const { nanoid } = require("nanoid");
const fs = require('fs');
const mime = require('mime');

// Sign up user
// router.post("/signup", async (req, res) => {
//     try {
//         const { firstName, lastName, email, password, phoneNumber, address } = req.body;
//         if (!firstName || !lastName || !email || !password || !phoneNumber || !address) {
//             res.status(400).json({ message: "Fields are required", data: null });
//             return;
//         }
//         const user = new User({
//             firstName: firstName,
//             lastName: lastName,
//             email: email,
//             password: password,
//             isApproved: false,
//             verificationCode: "",
//             phoneNumber: phoneNumber,
//             address: address,
//             profilePicture: ""
//         });
//         // Check if email exists in db 
//         const emailExists = await User.findOne({ email: user.email });
//         if (emailExists) {
//             res.status(400).json({ message: "Email Already Exists", data: null });
//             return;
//         }
//         if (password.length < 7) {
//             res.status(400).json({ message: "Password length must be at least 7 characters", data: null });
//             return;
//         }
//         const salt = await bcrypt.genSalt(10); // salt to hash password
//         user.password = await bcrypt.hash(user.password, salt); // user password to hashed password
//         const randomCode = helper.randomString(8); // generating random code for verification
//         user.verificationCode = await bcrypt.hash(randomCode, salt);
//         const userResponse = await user.save(
//             async (error, documentSaved, numberOfRowsAffected) => {
//                 if (documentSaved) {
//                     helper.sendEmail(user.email, "Confirm your email", user.firstName, `Please use this verification code to complete your sign up: ${randomCode}`);
//                     res.status(200).json({ message: "Signed up successfully", data: userResponse });
//                     return;
//                 } else {
//                     res.status(500).json({ message: "There was some problem at this time please try again later", data: null });
//                     return;
//                 }
//             }
//         );
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message, data: null });
//     }
// });

// Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Fields are required", data: null });
            return;
        }
        const user = await User.findOne({ email: email });
        if (user) {
            // checking user password with hashed password stored in the database
            const validPassword = await bcrypt.compare(password, user.password);
            if (validPassword) {
                var token = jwt.sign(
                    { user },
                    process.env.JWT_KEY,
                    { expiresIn: "1h" });
                res.status(200).json({ message: "Login successfully", data: { user: user, token: token } });
                return;
            } else {
                res.status(400).json({ message: "Invalid Password", data: null });
                return;
            }
        } else {
            res.status(404).json({ message: "User does not exist", data: null });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", data: null });
        return;
    }
});

// Verify email
router.post("/verification/:userId", async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            if (!req.body.verificationCode) {
                res.status(400).json({ message: "Fields are required" });
                return;
            }
            if (user.isApproved) {
                res.status(400).json({ message: "User is already verified" });
                return;
            } else {
                // checking user verfication code with hashed code stored in the database
                const validCode = await bcrypt.compare(req.body.verificationCode, user.verificationCode);
                if (validCode) {
                    user.isApproved = true;
                    user.verificationCode = "";
                    await user.save();
                    res.status(200).json({ message: "User verified successfully" });
                    return;
                } else {
                    res.status(400).json({ message: "Wrong verification code" });
                    return;
                }
            }
        }
        res.status(404).json({ message: "User was not found" });
    }).catch(() => {
        res.status(500).json({ message: "Something went wrong" });
    })

});

// Resend verification code
router.post("/resend-verification-code/:userId", async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            if (user.isApproved) {
                res.status(400).json({ message: "User is Already Verified" });
                return;
            } else {
                const salt = await bcrypt.genSalt(10);
                const randomCode = helper.randomString(8);
                user.verificationCode = await bcrypt.hash(randomCode, salt);
                try {
                    await user.save();
                    helper.sendEmail(user.email, "Confirm your email", user.firstName, `Please use this verification code to complete your sign up: ${randomCode}`);
                    res.json({ message: "Code send successfully" });
                    return;
                } catch (error) {
                    res.status(400).json({ message: error.message });
                }
                return;
            }
        }
        res.status(404).json({ message: "User was not found", data: null });
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// Upload profile picture
router.post("/upload-profile-picture/:userId", auth, async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            if (!req.body.image) {
                res.status(400).json({ message: "Image can't be empty" });
                return;
            }
            // Check if user already uploaded profile picture
            if (user.profilePicture.length > 0) {
                // Delete previous image
                fs.unlink(`${process.env.IMAGE_PATH}${user.profilePicture}`, (error) => {
                    // console.log(error);
                });
            }
            try {
                let userImageID = "";
                var matches = req.body.image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/), response = {};
                if (matches.length !== 3) {
                    res.status(400).json({ message: "Invalid input string for image" });
                    return;
                }
                response.type = matches[1];
                response.data = new Buffer.from(matches[2], 'base64');
                let decodedImg = response;
                let imageBuffer = decodedImg.data;
                let type = decodedImg.type;
                let extension = mime.extension(type);
                let fileName = `${nanoid()}.` + extension;
                userImageID = fileName;
                try {
                    fs.writeFileSync(process.env.IMAGE_PATH + fileName, imageBuffer, 'utf8');
                    user.profilePicture = userImageID;
                    await user.save();
                    res.status(200).json({ message: "Profile picture uploaded successfully" });
                    return;
                } catch (e) {
                    res.status(400).json({ message: e.message });
                    return;
                }
            } catch (error) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        res.status(404).json({ message: "User was not found", data: null });
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// Get all users
router.get("/", (req, res) => {
    User.find().then(async (users) => {
        res.status(200).json({ message: "All users", data: users });
        return;
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong", data: null });
    });
});

// Get user by userId
router.get("/:userId", async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            res.status(200).json({ message: "User found successfully", data: user });
            return;
        }
        res.status(404).json({ message: "User was not found", data: null });
    }).catch(() => {
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// Forgot Password
router.post("/forgotpassword", async (req, res) => {
    await User.findOne({ email: req.body.email }).then(async user => {
        if (user) {
            //salt to hash password
            const salt = await bcrypt.genSalt(10);
            // generating random code for verification 
            const randomCode = helper.randomString(8);
            user.verificationCode = await bcrypt.hash(randomCode, salt);
            try {
                await user.save();
                helper.sendEmail(user.email, "Forgot password", user.firstName, `Please use this verification code to change your password: ${randomCode}`);
                res.status(200).json({ message: "Code send successfully" });
                return;
            } catch (error) {
                res.status(400).json({ message: error.message });
            }
            return;
        }
        res.status(404).json({ message: "User was not found", data: null });
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// Forgot Password->Change Password
router.post("/forgotpassword/changepassword/:email", async (req, res) => {
    await User.findOne({ email: req.params.email }).then(async user => {
        if (user) {
            if (!req.body.verificationCode || !req.body.password) {
                res.status(400).json({ message: "Fields are required" });
                return;
            }
            // checking user verfication code with hashed code stored in the database
            const validCode = await bcrypt.compare(req.body.verificationCode, user.verificationCode);
            if (validCode) {
                if (req.body.password !== null && req.body.password !== '' && req.body.password.length >= 7) {
                    //salt to hash password
                    const salt = await bcrypt.genSalt(10);
                    //user password to hashed password
                    user.password = await bcrypt.hash(req.body.password, salt);
                    user.verificationCode = "";
                    try {
                        await user.save();
                        res.status(200).json({ message: "Password changed successfully" });
                    } catch (error) {
                        res.status(400).json({ message: error.message });
                    }
                    return;
                } else {
                    res.status(400).json({ message: "Invalid password length" });
                    return;
                }
            } else {
                res.status(400).json({ message: "Invalid verification code" });
                return;
            }
        }
        res.status(404).json({ message: "User was not found" });
        return;
    }).catch((error) => {
        res.status(500).json({ message: "Something went wrong" });
    })
});




module.exports = router;