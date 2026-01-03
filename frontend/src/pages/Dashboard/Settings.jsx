// src/pages/Dashboard/Settings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Code, 
  Brain, 
  Save, 
  Monitor, 
  Languages, 
  Loader2,
  CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // State structured as per the required request body
  const [settings, setSettings] = useState({
    default_language: 'javascript',
    socratic_level: 3,
    editor_config: {
      theme: 'vs-dark',
      font_size: 16,
      keybindings: 'default',
      line_numbers: 'on',
      word_wrap: 'on'
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/profile/settings');
        if (data) setSettings(data);
      } catch (err) {
        console.error("Failed to fetch settings, using defaults.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      // POST /profile/settings with the full settings object
      await api.post('/profile/settings', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-green-600 w-12 h-12" />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Workspace Settings</h1>
          <p className="text-slate-500">Configure your AI tutor and coding environment.</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="min-w-[140px]">
          {success ? <CheckCircle size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
          {success ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* --- AI & Learning Section --- */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-8 text-green-600">
            <Brain size={24} />
            <h3 className="text-xl font-bold">AI & Learning</h3>
          </div>
          
          <div className="space-y-8">
            <SettingItem 
              label="Default Programming Language" 
              description="Your preferred language for generated coding problems."
              icon={<Languages size={18} />}
            >
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-green-50/500"
                value={settings.default_language}
                onChange={(e) => setSettings({...settings, default_language: e.target.value})}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="java">Java (OpenJDK)</option>
                <option value="go">Golang</option>
                <option value="rust">Rust</option>
              </select>
            </SettingItem>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-black">Socratic Intensity (Level {settings.socratic_level})</p>
                  <p className="text-xs text-slate-500">Determines how much help the AI tutor provides.</p>
                </div>
              </div>
              <input 
                type="range" 
                min="1" max="5" step="1"
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                value={settings.socratic_level}
                onChange={(e) => setSettings({...settings, socratic_level: parseInt(e.target.value)})}
              />
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-green-600/70">
                <span>Direct</span>
                <span>Balanced</span>
                <span>Master</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- Editor Configuration Section --- */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-8 text-green-600">
            <Monitor size={24} />
            <h3 className="text-xl font-bold">Editor Config</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SettingItem label="Editor Theme">
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                value={settings.editor_config.theme}
                onChange={(e) => setSettings({
                  ...settings, 
                  editor_config: { ...settings.editor_config, theme: e.target.value }
                })}
              >
                <option value="vs-dark">VS Dark</option>
                <option value="light">Light</option>
                <option value="monokai">Monokai</option>
                <option value="dracula">Dracula</option>
              </select>
            </SettingItem>

            <SettingItem label="Font Size">
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                value={settings.editor_config.font_size}
                onChange={(e) => setSettings({
                  ...settings, 
                  editor_config: { ...settings.editor_config, font_size: parseInt(e.target.value) }
                })}
              />
            </SettingItem>

            <SettingItem label="Keybindings">
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                value={settings.editor_config.keybindings}
                onChange={(e) => setSettings({
                  ...settings, 
                  editor_config: { ...settings.editor_config, keybindings: e.target.value }
                })}
              >
                <option value="default">Standard</option>
                <option value="vim">Vim</option>
                <option value="emacs">Emacs</option>
              </select>
            </SettingItem>

            <SettingItem label="Line Numbers">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                {['on', 'off'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSettings({
                      ...settings, 
                      editor_config: { ...settings.editor_config, line_numbers: opt }
                    })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.editor_config.line_numbers === opt ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>
            </SettingItem>
          </div>
        </section>

      </div>
    </div>
  );
};

const SettingItem = ({ label, description, children }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="max-w-md">
      <p className="font-bold text-black">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
    <div className="w-full md:w-48">
      {children}
    </div>
  </div>
);

export default SettingsPage;