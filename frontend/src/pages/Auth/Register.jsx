import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Zap, Rocket, AlertCircle, Mail } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerifiedRequired, setIsVerifiedRequired] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    persona: 'student' 
  });

  const personas = [
    { id: 'student', title: 'Student', icon: <GraduationCap />, desc: 'Currently in school or university' },
    { id: 'upskiller', title: 'Upskiller', icon: <Zap />, desc: 'Professional learning new tech' },
    { id: 'casual', title: 'Casual', icon: <Briefcase />, desc: 'Learning for fun/hobby' },
    { id: 'seasoned_dev', title: 'Expert', icon: <Rocket />, desc: 'Senior dev mastering a new stack' },
  ];

  const handleInitialSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Hit Register endpoint
      const registerRes = await api.post('/register', {
        email: formData.email,
        password: formData.password
      });

      // Check if registration was successful based on your JSON structure
      if (registerRes.data.message.includes("successful")) {
        // We move to step 2 immediately so they can pick their persona
        // even if they aren't 'logged in' yet due to email verification
        setStep(2);
      }
      
      // 2. Optional: Try to login to get JWT. 
      // If this fails because of verification, we ignore it for now 
      // so the user can at least finish the persona step.
      try {
        const loginRes = await api.post('/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', loginRes.data.token);
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      } catch (loginErr) {
        console.log("Auto-login skipped: Email verification likely required.");
        setIsVerifiedRequired(true);
      }

    } catch (err) {
      // If the email already exists or there's a real error
      setError(err.response?.data?.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    setError("");

    try {
      // Note: If email verification is required, this API call might fail 
      // if your backend requires a token for /profile/setup.
      // If it fails, we show a 'Check your email' message.
      await api.post('/profile/setup', {
        persona: formData.persona,
        email: formData.email // Passing email as a fallback if token is missing
      });
      
      if (isVerifiedRequired) {
        setStep(3); // Move to a "Verify your email" success screen
      } else {
        navigate('/dashboard'); 
      }
    } catch (err) {
      // If the backend requires a token and user is unverified, handle here
      if (isVerifiedRequired) {
        setStep(3);
      } else {
        setError("Could not save profile. Please try logging in after verifying your email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100">
        
        {/* Progress Stepper */}
        {step < 3 && (
          <div className="flex items-center gap-4 mb-8">
            <div className={`h-2 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-green-600' : 'bg-slate-100'}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors duration-500 ${step === 2 ? 'bg-green-600' : 'bg-slate-100'}`} />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-black mb-2">Create Account</h2>
            <p className="text-slate-500 mb-8">Join thousands of developers leveling up.</p>
            <form className="space-y-4" onSubmit={handleInitialSignup}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-50/500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-50/500"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>
              <Button type="submit" isLoading={loading} className="w-full">Continue</Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-3xl font-bold text-black mb-2 text-center">Select your Persona</h2>
            <p className="text-slate-500 mb-8 text-center">We'll tailor your syllabus based on your background.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {personas.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => setFormData({...formData, persona: p.id})}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.persona === p.id 
                      ? 'border-green-600 bg-green-50/50 ring-4 ring-green-50/50' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`${formData.persona === p.id ? 'text-green-600' : 'text-green-600/70'} mb-2`}>
                    {p.icon}
                  </div>
                  <h3 className="font-bold text-black">{p.title}</h3>
                  <p className="text-xs text-slate-500">{p.desc}</p>
                </button>
              ))}
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 text-slate-600 font-bold">Back</button>
              <Button onClick={handleCompleteRegistration} isLoading={loading} className="flex-[2]">
                Complete Registration
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-indigo-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={40} />
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">Check your email</h2>
            <p className="text-slate-500 mb-8">
              We've sent a verification link to <b>{formData.email}</b>. 
              Please verify your email to access your dashboard.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">Back to Login</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;