import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import DashboardLayout from './components/Layout/Dashboardlayout.jsx';
import DashboardOverview from './pages/Dashboard/Overview.jsx';
import SyllabusList from './pages/Dashboard/SyllabusList.jsx';
import CreateSyllabus from './pages/Syllabus/CreateSyllabus.jsx';
import SyllabusDetail from './pages/Syllabus/SyllabusDetail.jsx';
import LevelBreaker from './pages/Assessment/LevelBreaker.jsx';
import PracticeLab from './pages/Practice/PracticeLab.jsx';
import ProfilePage from './pages/Dashboard/Profile.jsx';
import SettingsPage from './pages/Dashboard/Settings.jsx';
import ProblemList from './pages/Practice/ProblemList.jsx';


function App() {
  return (
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200">
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} /> {/* /dashboard */}
            <Route path="syllabi" element={<SyllabusList />} /> {/* /dashboard/syllabi */}
            <Route path="syllabi/create" element={<CreateSyllabus />} />
            <Route path="syllabi/:id" element={<SyllabusDetail />} />
            <Route path="assessment" element={<LevelBreaker />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Full-screen Practice Mode (Maximizes screen real estate) */}
          <Route path="/practice/:syllabusId/:week/:problemId?" element={<PracticeLab />} />
          <Route path="/problems" element={<ProblemList />} />
        </Routes>
        </div>
      </Router>
  );
}

export default App;