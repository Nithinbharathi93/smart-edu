import supabase from '../config/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  // 1. Get the token from the header (Bearer <token>)
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  const token = authHeader.split(' ')[1];

  // 2. Ask Supabase: "Is this token valid?"
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  // 3. Attach the user to the request object so controllers can use it
  req.user = user;
  
  // 4. Proceed to the next step
  next();
};