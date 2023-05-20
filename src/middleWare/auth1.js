const jwt = require("jsonwebtoken");
const User = require("../models/userModel");


const protect = (async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    try {
      token = req.headers.authorization.split(" ")[1];
      const decode = jwt.verify(token, "abcd123");
      req.user = await User.findById(decode.id).select("-password");
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json('Not Authenticated');
      
    }
  if (!token) {
    res.status(401).json("Not Authorized")
  }
});
module.exports = { protect };
