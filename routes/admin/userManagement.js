const express = require("express");
const router = express.Router();
const auth = require("../../utils/auth");
const User = require("../../models/user");
const fs = require("fs");
const Photo = require("../../models/photos");
const Video = require("../../models/videos");
const Status = require("../../models/status");
// const Comment = require("../../models/comments");
const helper = require("../../utils/Helper");
const bcrypt = require("bcrypt");
const PostMedia = require("../../models/postMedia");

// Create user
router.post("/create-user", auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;
    if (!firstName || !lastName || !email || !phoneNumber) {
      res.status(400).json({ message: "Fields are required", data: null });
      return;
    }
    const userPassword = helper.randomString(8); // generating random password
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: userPassword,
      // isApproved: false,
      verificationCode: "",
      phoneNumber: phoneNumber,
      profilePicture: "",
      galleryPage: "",
      galleryDescription: "",
    });
    // Check if email exists in db
    const emailExists = await User.findOne({ email: user.email });
    if (emailExists) {
      res.status(400).json({ message: "Email Already Exists", data: null });
      return;
    }
    const salt = await bcrypt.genSalt(10); // salt to hash password
    user.password = await bcrypt.hash(user.password, salt); // user password to hashed password
    // const randomCode = helper.randomString(8); // generating random code for verification
    // user.verificationCode = await bcrypt.hash(randomCode, salt);
    const userResponse = await user.save(
      async (error, documentSaved, numberOfRowsAffected) => {
        if (documentSaved) {
          helper.sendEmail(
            user.email,
            "Your Live Legacy Gallery Login Details + the login page link",
            user.firstName,
            `This email contains your login details for your new Live Legacy Gallery. Once you've logged in consider changing your password.`,
            userPassword
          );
          res
            .status(200)
            .json({ message: "User created successfully", data: userResponse });
          return;
        } else {
          res.status(500).json({
            message:
              "There was some problem at this time please try again later",
            data: null,
          });
          return;
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message, data: null });
  }
});

// Delete user
router.post("/delete-user/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }
    // Delete user
    await User.findByIdAndRemove(req.params.userId);
    // Delete users all photos
    const photos = await Photo.find({ userId: req.params.userId });
    await Photo.deleteMany({ userId: req.params.userId });
    // Delete photo data
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photoData = await PostMedia.find({ postId: photos[i]._doc._id });
        await PostMedia.deleteMany({ postId: photos[i]._doc._id });
        for (let j = 0; j < photoData.length; j++) {
          fs.unlink(`${process.env.IMAGE_PATH}${photoData[j]._doc.mediaName}`, (error) => { });
        }
      }
    }
    // Delete users all videos
    const videos = await Video.find({ userId: req.params.userId });
    await Video.deleteMany({ userId: req.params.userId });
    if (videos.length > 0) {
      for (let i = 0; i < videos.length; i++) {
        const videoData = await PostMedia.find({ postId: videos[i]._doc._id });
        await PostMedia.deleteMany({ postId: videos[i]._doc._id });
        for (let j = 0; j < videoData.length; j++) {
          fs.unlink(`${process.env.VIDEO_PATH}${videoData[j]._doc.mediaName}`, (error) => { });
        }
      }
    }
    // for (let i = 0; i < videos.length; i++) {
    //   fs.unlink(
    //     `${process.env.VIDEO_PATH}${videos[i]._doc.videoName}`,
    //     (error) => {
    //       // console.log(error);
    //     }
    //   );
    // }
    // Delete users all status
    await Status.deleteMany({ userId: req.params.userId });
    // Delete users all comments
    // await Comment.deleteMany({ userId: req.params.userId });
    res.status(200).json({ message: "User deleted successfully" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    return;
  }
});

module.exports = router;
