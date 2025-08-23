import jwt from "jsonwebtoken";

const authenticateUser = (req, res, next) => {
  const authHeader = req.header("Authorization");

  // Check if Authorization header exists
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided, authorization denied" });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    req.user = decoded.user; // { id: user.id }
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "Token is not valid" });
  }
};

export default authenticateUser;