import React, { useState, useEffect } from 'react';
import { User, Shield, Award, Calendar, Edit2, Loader2, Target, CheckCircle2, Mail, Hash, MapPin, X, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  
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
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const personaMap = {
    student: { label: 'Academic Student', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    upskiller: { label: 'Professional Upskiller', color: 'bg-green-50/50 text-green-600 border-indigo-100' },
    casual: { label: 'Casual Learner', color: 'bg-green-50 text-green-600 border-green-100' },
    seasoned_dev: { label: 'Expert Developer', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  };

  const userInitial = userData.full_name 
    ? userData.full_name[0].toUpperCase() 
    : (userData.email ? userData.email[0].toUpperCase() : '?');

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-green-50/500 w-10 h-10 mb-4" />
      <p className="text-green-600/70 text-[10px] font-black uppercase tracking-widest">Accessing Secure Profile...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation / Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-black tracking-tight uppercase">Learner Profile</h1>
          <p className="text-[11px] font-bold text-green-600/70 uppercase tracking-widest flex items-center gap-2 mt-1">
            <Shield size={12} className="text-green-500" /> Account ID: {userData.id.substring(0, 8)}
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="h-9 px-4 text-xs bg-black hover:bg-black">
            <Edit2 size={14} className="mr-2" /> Modify Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest">Cancel</button>
            <Button onClick={handleSave} isLoading={saving} className="h-9 px-6 text-xs bg-green-600 hover:bg-green-50/500">
              Commit Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Identity & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-black flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
              {userInitial}
            </div>
            {isEditing ? (
              <input 
                className="w-full text-center text-lg font-bold border-b-2 border-indigo-100 focus:border-green-50/500 outline-none bg-transparent py-1 transition-colors"
                value={userData.full_name}
                onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                placeholder="Full Name"
              />
            ) : (
              <h2 className="text-lg font-black text-black tracking-tight">{userData.full_name || 'Anonymous Learner'}</h2>
            )}
            <div className="flex items-center justify-center gap-2 text-green-600/70 text-[11px] mt-2 font-bold">
              <Mail size={12} /> {userData.email}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-center gap-4 text-green-600/70">
              <div className="text-center">
                <p className="text-[10px] uppercase font-black tracking-tighter">Joined</p>
                <p className="text-[11px] text-black font-bold">{userData.joinedDate}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-indigo-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Proficiency Rank</span>
              </div>
              <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded">LEVEL {userData.current_level}</span>
            </div>
            <div className="text-2xl font-black mb-4 relative z-10">{userData.level_name}</div>
            
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between text-[10px] font-black uppercase text-indigo-100">
                <span>Progress to Mastery</span>
                <span>{Math.round((userData.current_level/6)*100)}%</span>
              </div>
              <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                  style={{ width: `${(userData.current_level / 6) * 100}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Details & Goals */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-8 border-b border-slate-50 pb-4">
              <User size={16} className="text-green-50/500" /> 
              <h3 className="text-xs font-black text-black uppercase tracking-widest">Personal Identification</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] font-black text-green-600/70 uppercase tracking-widest block mb-2">Persona Strategy</label>
                {isEditing ? (
                  <select 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-green-50/500 outline-none transition-all"
                    value={userData.persona}
                    onChange={(e) => setUserData({...userData, persona: e.target.value})}
                  >
                    <option value="student">Student</option>
                    <option value="upskiller">Professional Upskiller</option>
                    <option value="casual">Casual Learner</option>
                    <option value="seasoned_dev">Expert Developer</option>
                  </select>
                ) : (
                  <div className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[11px] font-black border uppercase tracking-tighter ${personaMap[userData.persona]?.color}`}>
                    {personaMap[userData.persona]?.label}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-green-600/70 uppercase tracking-widest block mb-2">Learning Bio</label>
                {isEditing ? (
                  <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 h-24 text-sm font-medium focus:ring-2 focus:ring-green-50/500 outline-none bg-slate-50 transition-all"
                    value={userData.bio}
                    onChange={(e) => setUserData({...userData, bio: e.target.value})}
                    placeholder="Brief overview of your background..."
                  />
                ) : (
                  <p className="text-sm text-slate-500 leading-relaxed italic font-medium">
                    {userData.bio || 'Your journey details will appear here.'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-rose-500" /> 
                <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Growth Objectives</h3>
              </div>
              <span className="text-[10px] font-bold text-green-600/70 bg-slate-50 px-2 py-0.5 rounded italic">
                {userData.goals.length} Active Goals
              </span>
            </div>

            <div className="space-y-4">
              {/* Goal Tags Container */}
              <div className="flex flex-wrap gap-2">
                {userData.goals.length > 0 ? (
                  userData.goals.map((goal, i) => (
                    <div 
                      key={i} 
                      className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-200 transition-all"
                    >
                      <CheckCircle2 size={12} className="text-green-500 shrink-0" /> 
                      <span className="text-[11px] font-bold text-slate-600 tracking-tight">{goal}</span>
                      
                      {isEditing && (
                        <button 
                          onClick={() => {
                            const updatedGoals = userData.goals.filter((_, idx) => idx !== i);
                            setUserData({ ...userData, goals: updatedGoals });
                          }}
                          className="ml-1 p-0.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Objective"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="w-full py-4 text-center border-2 border-dashed border-slate-50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No objectives defined yet</p>
                  </div>
                )}
              </div>

              {/* Inline Add Goal Input (Only in Edit Mode) */}
              {isEditing && (
                <div className="pt-4 border-t border-slate-50">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-50/500/20 focus:border-indigo-300 transition-all"
                      placeholder="Type a new learning goal..."
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newGoal.trim()) {
                          e.preventDefault();
                          setUserData({ ...userData, goals: [...userData.goals, newGoal.trim()] });
                          setNewGoal("");
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (newGoal.trim()) {
                          setUserData({ ...userData, goals: [...userData.goals, newGoal.trim()] });
                          setNewGoal("");
                        }
                      }}
                      className="p-2 bg-black text-white rounded-xl hover:bg-green-600 transition-all active:scale-95 shadow-sm"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <p className="mt-2 text-[9px] font-bold text-green-600/70 uppercase tracking-tight ml-1">
                    Press Enter or click + to add to your path
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;