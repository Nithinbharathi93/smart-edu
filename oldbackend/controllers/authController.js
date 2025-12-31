import supabase from '../config/supabaseClient.js';

export const registerUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Sign Up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        // 2. Check if a session was created immediately
        // (Depends on if you have "Confirm Email" enabled in Supabase dashboard)
        if (data.session) {
            res.status(201).json({
                message: "User registered successfully!",
                token: data.session.access_token,
                user: data.user
            });
        } else {
            // If email confirmation is ON, Supabase won't return a session yet
            res.status(200).json({
                message: "Registration successful! Please check your email to confirm your account.",
                user: data.user
            });
        }

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // 2. Return the "Passport" (Access Token) to the frontend
        res.json({
            message: "Login successful!",
            token: data.session.access_token,
            user: {
                id: data.user.id,
                email: data.user.email
            }
        });

    } catch (error) {
        res.status(401).json({ error: "Invalid email or password" });
    }
};