import React, { useState, useEffect } from 'react';
import { User, Shield, Award, Calendar, Edit2, Loader2, Target, CheckCircle2, Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [userData, setUserData] = useState({
    id: '',
    email: '',
    full_name: '',
    persona: 'upskiller',
    level_name: 'Novice',
    current_level: 1,
    bio: '',
    goals: [],
    joinedDate: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const { data } = await api.get('/profile/me');
      
      setUserData({
        ...data,
        email: savedUser.email || data.email || '',
        joinedDate: data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        }) : 'January 2026'
      });
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        full_name: userData.full_name,
        persona: userData.persona,
        goals: userData.goals,
        bio: userData.bio
      };

      const { data } = await api.post('/profile/setup', payload);
      setUserData(prev => ({ ...prev, ...data.profile }));
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const personaMap = {
    student: { label: 'Student', color: 'bg-blue-100 text-blue-700' },
    upskiller: { label: 'Upskiller', color: 'bg-indigo-100 text-indigo-700' },
    casual: { label: 'Casual Learner', color: 'bg-emerald-100 text-emerald-700' },
    seasoned_dev: { label: 'Expert Developer', color: 'bg-purple-100 text-purple-700' },
  };

  // Pure letter-based initial logic
  const userInitial = userData.full_name 
    ? userData.full_name[0].toUpperCase() 
    : (userData.email ? userData.email[0].toUpperCase() : '?');

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500">Manage your profile and learning preferences.</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="secondary">
            <Edit2 size={16} className="mr-2" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>Save Changes</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-indigo-100">
              {userInitial}
            </div>
            {isEditing ? (
              <input 
                className="w-full text-center text-xl font-bold border-b border-indigo-200 focus:outline-none bg-indigo-50/30 rounded px-2"
                value={userData.full_name}
                onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                placeholder="Your Full Name"
              />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900">{userData.full_name || 'Anonymous User'}</h2>
            )}
            <p className="text-slate-400 text-sm mt-1">{userData.email}</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <Award className="text-indigo-400" />
              <span className="font-bold tracking-tight">Proficiency Level</span>
            </div>
            <div className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              {userData.level_name}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mb-4">
              <span>Stage {userData.current_level} of 6</span>
              <span>{Math.round((userData.current_level/6)*100)}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-400 h-full transition-all duration-700 ease-out" 
                style={{ width: `${(userData.current_level / 6) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User size={20} className="text-indigo-500" /> Bio & Persona
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Persona Type</label>
                {isEditing ? (
                  <select 
                    className="w-full mt-2 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={userData.persona}
                    onChange={(e) => setUserData({...userData, persona: e.target.value})}
                  >
                    <option value="student">Student</option>
                    <option value="upskiller">Upskiller</option>
                    <option value="casual">Casual Learner</option>
                    <option value="seasoned_dev">Seasoned Developer</option>
                  </select>
                ) : (
                  <div className={`mt-2 inline-block px-4 py-1.5 rounded-full text-sm font-bold ${personaMap[userData.persona]?.color}`}>
                    {personaMap[userData.persona]?.label}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">About Me</label>
                {isEditing ? (
                  <textarea 
                    className="w-full mt-2 p-4 rounded-2xl border border-slate-200 h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={userData.bio}
                    onChange={(e) => setUserData({...userData, bio: e.target.value})}
                    placeholder="Tell us about your background..."
                  />
                ) : (
                  <p className="mt-2 text-slate-600 leading-relaxed italic">
                    {userData.bio || 'Write a short bio to personalize your learning experience.'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Target size={20} className="text-rose-500" /> Learning Goals
            </h3>
            <div className="flex flex-wrap gap-3">
              {userData.goals.length > 0 ? (
                userData.goals.map((goal, i) => (
                  <span key={i} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700">
                    <CheckCircle2 size={16} className="text-emerald-500" /> {goal}
                  </span>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No goals set yet.</p>
              )}
              
              {isEditing && (
                <button 
                  onClick={() => {
                    const g = prompt("What is your learning goal?");
                    if(g) setUserData({...userData, goals: [...userData.goals, g]});
                  }}
                  className="px-4 py-2 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  + Add Goal
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;