import jwt from "jsonwebtoken";
import redisClient, { redisAvailable } from "../config/redis.js";

const authenticateUser = async (req, res, next) => {

  let token = req.cookies?.token;

  if (!token) {

    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ error: "No token provided, authorization denied" });
  }


  try {


    if (redisAvailable) {
      const blacklisted = await redisClient.get(`blacklist:${token}`);

      if (blacklisted) {
        return res
          .status(401)
          .json({ error: "Token has been invalidated. Please login again." });
      }
    }
  } catch (redisError) {
    console.error("Redis blacklist check error:", redisError);
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded.user; // { id: user.id }
    req.token = token; // Store token for potential logout use
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);

    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired, please login again" });
    }

    return res.status(401).json({ error: "Token is not valid" });
  }
};

export default authenticateUser;
