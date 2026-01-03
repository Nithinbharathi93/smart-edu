// src/pages/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // The axios instance
import Button from '../../components/ui/Button';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post('/login', formData);
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200 w-full max-w-md border border-slate-100">
        <h2 className="text-3xl font-bold text-black mb-2">Welcome back</h2>
        <p className="text-slate-500 mb-8">Continue your learning journey.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-50/500 outline-none transition-all"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <button type="button" className="text-sm text-green-600 hover:underline">Forgot?</button>
            </div>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-50/500 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <Button type="submit" isLoading={loading} className="w-full">
            Sign In
          </Button>
        </form>
        
        <p className="text-center mt-6 text-slate-600 text-sm">
          Don't have an account? <a href="/register" className="text-green-600 font-bold hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;