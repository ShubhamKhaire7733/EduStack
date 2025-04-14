const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// reset password token
exports.resetPasswordToken = async (req, res) => {
	try {
        // get email from request body
		const email = req.body.email;
        // check user for this mail, email verification
		const user = await User.findOne({ email: email });
		if (!user) {
			return res.json({
				success: false,
			 	message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
			});
		}
        // generate token
		const token = crypto.randomBytes(20).toString("hex");
        // update user details by adding token and expiry time
		const updatedDetails = await User.findOneAndUpdate(
			{ email: email },
			{
				token: token,
				resetPasswordExpires: Date.now() + 3600000,
			},
			{ new: true }
		);
		console.log("DETAILS", updatedDetails);
        // create url
		const url = `https://studyvault-frontend.onrender.com/update-password/${token}`;
        // send mail to user containing url
		await mailSender(
			email,
			"Password Reset",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`
		);

		res.json({
			success: true,
			message:
				"Email Sent Successfully, Please Check Your Email to Continue Further",
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Sending the Reset Message`,
		});
	}
};

// reset password 
exports.resetPassword = async (req, res) => {
	try {
        // data fetched from request body
		const { password, confirmPassword, token } = req.body;
        // validation
		if (confirmPassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}
        // get userDeatils from db using token
		const userDetails = await User.findOne({ token: token });
		// if no entry no token
        if (!userDetails) {
			return res.json({
				success: false,
				message: "Token is Invalid",
			});
		}
        //token  time check
		if (!(userDetails.resetPasswordExpires > Date.now())) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}
        // hash password
		const encryptedPassword = await bcrypt.hash(password, 10);
		await User.findOneAndUpdate(
			{ token: token },
			{ password: encryptedPassword },
			{ new: true }
		);
        // send response
		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}
};
