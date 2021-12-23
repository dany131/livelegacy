const express = require("express");
const router = express.Router();
const auth = require("../../utils/auth");
const User = require("../../models/user");
const bcrypt = require("bcrypt");

// Update profile info
router.post("/update-personal-information/:userId", auth, async (req, res) => {
  await User.findById(req.params.userId)
    .then(async (user) => {
      if (user) {
        const { firstName, lastName, phoneNumber } = req.body;
        if (!firstName || !lastName || !phoneNumber) {
          res.status(400).json({ message: "Fields are required" });
          return;
        }
        user.firstName = firstName;
        user.lastName = lastName;
        user.phoneNumber = phoneNumber;
        try {
          await user.save();
          res
            .status(200)
            .json({ message: "Personal information updated successfully" });
        } catch (error) {
          res.status(400).json({ message: error.message });
        }
        return;
      }
      res.status(404).json({ message: "User was not found" });
      return;
    })
    .catch((error) => {
      res.status(500).json({ message: "Something went wrong" });
    });
});

// Update gallery data
router.post("/update-gallery-information/:userId", auth, async (req, res) => {
  await User.findById(req.params.userId)
    .then(async (user) => {
      if (user) {
        const { galleryPage, galleryDescription } = req.body;
        // if (!galleryPage || !galleryDescription) {
        //   res.status(400).json({ message: "Fields are required" });
        //   return;
        // }
        if (galleryPage.length > 100) {
          res
            .status(400)
            .json({ message: "Title should be less than 100 characters" });
          return;
        }
        if (galleryDescription.length > 1000) {
          res
            .status(400)
            .json({ message: "Description should be less than 1000 characters" });
          return;
        }
        user.galleryPage = galleryPage;
        user.galleryDescription = galleryDescription;
        try {
          await user.save();
          res
            .status(200)
            .json({ message: "Gallery information updated successfully" });
        } catch (error) {
          res.status(400).json({ message: error.message });
        }
        return;
      }
      res.status(404).json({ message: "User was not found" });
      return;
    })
    .catch((error) => {
      res.status(500).json({ message: "Something went wrong" });
    });
});

// Change password
router.post("/change-password/:userId", auth, async (req, res) => {
  await User.findById(req.params.userId)
    .then(async (user) => {
      if (user) {
        const { newpassword, oldpassword } = req.body;
        if (!newpassword || !oldpassword) {
          res.status(400).json({ message: "Fields are required" });
          return;
        }
        // checking user password with hashed password stored in the database
        const checkOldPassword = await bcrypt.compare(
          newpassword,
          user.password
        );
        if (checkOldPassword) {
          res
            .status(400)
            .json({ message: "New password can't be old password" });
          return;
        } else {
          // checking if the old password of user is valid
          const validOldPassword = await bcrypt.compare(
            oldpassword,
            user.password
          );
          if (validOldPassword) {
            if (
              newpassword !== null &&
              newpassword !== "" &&
              newpassword.length >= 7
            ) {
              //salt to hash password
              const salt = await bcrypt.genSalt(10);
              //user password to hashed password
              user.password = await bcrypt.hash(newpassword, salt);
              try {
                await user.save();
                res
                  .status(200)
                  .json({ message: "Password changed successfully" });
              } catch (error) {
                res.status(400).json({ message: error.message });
              }
              return;
            } else {
              res.status(400).json({ message: "Invalid password length" });
              return;
            }
          } else {
            res.status(400).json({ message: "Invalid old password" });
            return;
          }
        }
      }
      res.status(404).json({ message: "User was not found" });
      return;
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    });
});

module.exports = router;
