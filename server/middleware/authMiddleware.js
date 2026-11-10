
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT and authenticate user
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please provide a token.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find current user in database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    // Attach authenticated user to request
    req.user = user;

    next();

  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

// Check user roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};
