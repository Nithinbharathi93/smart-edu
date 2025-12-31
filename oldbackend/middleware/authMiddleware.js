import supabase from '../config/supabaseClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const requireAuth = async (req, res, next) => {
  // Get the token from the header (Bearer <token>)
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Invalid authorization header format" });
  }

  try {
    // Decode the JWT token to extract user data
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      return res.status(403).json({ error: "Invalid token format" });
    }

    // Extract user info from token payload
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      aud: decoded.aud
    };

    return next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};