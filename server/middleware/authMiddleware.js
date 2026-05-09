import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(403).json("No token");

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json("Invalid token");

    req.user = user;
    next();
  });
};

export const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json("Admin only");

  next();
};