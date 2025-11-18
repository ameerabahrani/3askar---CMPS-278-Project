const router = require("express").Router();
const passport = require("passport");
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); //secure random token generator
const sendEmail = require('../utils/sendEmail'); //email sending utility

// Step 1 — Login with Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2 — Google callback URL
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: "http://localhost:5173", // front-end
  })
);

// Step 3 — Logout TODO: check for error, make sure the session ends, and redirect back to the login page when its impelemented not the homepage
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:5173");
  });
});


router.post('/login', async (req, res) => {
  try{
     const { email, password, rememberMe } = req.body;

    if (!email){
      return res.status(400).send("Email not provided");
    }

    if (!password){
      return res.status(400).send("Password not provided");
    }

    const checkUser = await User.findOne({email: `${email}`});

    if (!checkUser){
      return res.status(400).send("Email doesnt exist");
    }
    if (!checkUser.passwordHash){
      return res.status(400).send("Password doesnt exist");
    }

    //checks of the stored encrypted password matches the password inputted by the user
    const match = await bcrypt.compare(password, checkUser.passwordHash);

    if (match) {
      // Decide cookie lifetime based on rememberMe
      if (rememberMe) {
        // 30 days
        req.sessionOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        // Short session: 1 hour
        req.sessionOptions.maxAge = 60 * 60 * 1000;
      }

      req.login(checkUser, (err) => {
        if (err) {
          console.error("Passport login error:", err);
          return res.status(500).send("login failed");
        }
        return res.status(200).send("Login successful");
      });
    } else {
      return res.status(401).send("invalid email or password");
    }


  } catch (error){
    console.error('Error during login:', error);
    return res.status(500).send("Internal server error during login");
  }

});

const months = Object.freeze(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]);


router.post('/register', async (req, res) => {
  const {firstName, lastName, email, password, dobMonth, dobDay, dobYear} = req.body;
  const monthIndex = months.indexOf(dobMonth);


  if (!firstName || !lastName || !email || !password || !dobMonth || !dobDay || !dobYear){
    return res.status(400).send("missing field");
  }

  if (await User.findOne({email : `${email}`})){
    return res.status(400).send('user already exists');
  }

  //hash the password using 10 salt thingy i dont understand saraha
  const hashedPassword = await bcrypt.hash(password, 10);

  //create user
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    passwordHash: hashedPassword,
    dob: new Date(dobYear, monthIndex, dobDay)
  });

  //instanlty log inn and create a session for them
  req.login(newUser, (err) => {
    if (err){
      console.log('login failed');
    }
    return res.status(200).send('Login successful');
  });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send("Email not provided");
    }

    const user = await User.findOne({ email });

    //Security 
    if(!user) {
      return res.status(200).send('If an account with that email exists, a reset link has been sent');
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    //Set token and expiry 15 minutes from now
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();
    
    const resetLink = `http://localhost:5173/reset-password/${token}`;
    console.log(`Password reset link for ${email}: ${resetLink}`); //Print to console instead of sending email

        const subject = "Reset your 3askar Drive password";

        const text = `You requested a password reset for your 3askar Drive account.
    Reset link (valid for 15 minutes): ${resetLink}
    If you did not request this, you can ignore this email.`;

        const html = `
          <p>You requested a password reset for your <strong>3askar Drive</strong> account.</p>
          <p>Click the button below to reset your password (valid for 15 minutes):</p>
          <p>
            <a href="${resetLink}"
              style="display:inline-block;padding:10px 16px;background:#1a73e8;color:#ffffff;
                      text-decoration:none;border-radius:4px;">
              Reset Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `;


    await sendEmail({ to: email, subject, text, html }); // eamil is sent using nodemailer    
    try {
      await sendEmail({
        to: email,
        subject,
        text,
        html,
      });
    } catch (emailErr) {
      console.error("Error sending reset email:", emailErr);
      return res.status(500).send("Error sending reset email");
    }
    //TODO CLEAN IT UP LATER
    return res.status(200).json({
      message: 'IF an account with that email exists, a reset link has been sent',
      resetLink
    });

  } catch (error) {
    return res.status(500).send('Error during password reset request');
  }
});

router.post('/reset-password', async (req, res) => {

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).send("Token and new password are required");
    }

    //Find user with matching takoen that isnt expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } //token expiry in the future
    });
    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }

    // Hash the new Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    //Update user password and clear reset token fields
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    //option A: just confirm success
    return res.status(200).send("Password has been reset successfully");

    //option B: LAter: log them in directly after reset
  } catch (error) {

    console.error('Error in /reset-password:', error);
    return res.status(500).send('Error during password reset');

  }

});
 

router.get("/failure", (req, res) => res.send("Login failed"));

module.exports = router;


