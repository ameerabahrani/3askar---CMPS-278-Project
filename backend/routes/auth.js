const router = require("express").Router();
const passport = require("passport");
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

// Step 3 — Logout TODO: something
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:5173");
  });
});


router.post('/login', async (req, res) => {
  try{
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password){
      return res.status(400).send("Email or Password not provided");
    }

    const checkUser = await User.findOne({email: `${email}`});

    if (!checkUser || !checkUser.passwordHash){
      return res.status(400).send("Email or Password doesnt exist");
    }

    //checks of the stored encrypted password matches the password inputted by the user
    const match = await bcrypt.compare(password, checkUser.passwordHash);

    if (match){
      req.login(checkUser, (err) => {
        if (err){
          return res.status(500).send('login failed');
        }
        return res.status(200).send('Login successful');
      });
    } else{
      return res.status(401).send('invalid email or password');
    }
  } catch (error){
    return res.status(500).send('Error during login');
  }

});

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


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
      return res.status(500).send('login failed');
    }
    return res.status(200).send('Login successful');
  });
});

router.get("/failure", (req, res) => res.send("Login failed"));

module.exports = router;
