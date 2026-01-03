import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SyllabusCard from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Loader2, Trophy, Plus, BookOpen, Zap, Target } from 'lucide-react';

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Updated to use the new flat endpoint
        const { data } = await api.get('/my-courses'); 
        setSyllabi(data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-green-600 w-12 h-12" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight">Your Workspace</h1>
          <p className="text-slate-500 mt-1 text-lg">Track your AI-generated learning paths.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/assessment')}>
            <Target size={18} className="mr-2" /> Level Breaker
          </Button>
          <Button onClick={() => navigate('/dashboard/syllabi/create')}>
            <Plus size={18} className="mr-2" /> New Syllabus
          </Button>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Recent Courses</h2>
        {syllabi.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {syllabi.slice(0, 3).map((s) => (
              <SyllabusCard 
                key={s.id} // uuid/int from response
                title={s.syllabus_title} // Flat field
                level={s.level} // "Beginner", etc.
                progress={0} 
                duration={s.duration} // "4 weeks", etc.
                onClick={() => navigate(`/dashboard/syllabi/${s.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyDashboard navigate={navigate} />
        )}
      </section>
    </div>
  );
};

const EmptyDashboard = ({ navigate }) => (
  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
    <Plus className="text-slate-300 mx-auto mb-4" size={32} />
    <h3 className="text-xl font-bold text-black">No courses yet</h3>
    <Button onClick={() => navigate('/dashboard/syllabi/create')} className="mt-6">
      Generate First Syllabus
    </Button>
  </div>
);

export default DashboardOverview;