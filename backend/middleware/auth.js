
//TEMPORARY DEV VERSION
// This middleware pretends the user is always authenticated
// and sets a fake user id so we can test folder logic.

function ensureAuth(req, res, next) {
  // Fake user object – looks like what passport/login would set
  req.user = {
    _id: "000000000000000000000000", // 24-char hex string → valid ObjectId format
  };

  // Always allow the request to continue
  next();
}

module.exports= ensureAuth;