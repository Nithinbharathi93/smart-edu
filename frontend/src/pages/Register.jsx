import { useState } from 'react';
import { Link } from 'react-router-dom';
// import logo from '../assets/logo.png';
import logo from "../assets/smartedu.png";

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMsg(data.message); 

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="flex justify-center mb-6">
             <img src={logo} alt="Smart Edu" className="h-16 w-auto" />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Create Account</h2>
        <p className="text-center text-gray-500 mb-8">Join Smart Edu today</p>
        
        {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        {successMsg && <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg mb-6 text-center">{successMsg}</div>}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                name="email"
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                name="password"
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                onChange={handleChange}
                placeholder="Create a strong password"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 hover:shadow-lg transition duration-200"
            >
              Sign Up
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account? <Link to="/login" className="text-green-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}