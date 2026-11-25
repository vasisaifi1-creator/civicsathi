import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { isSupabaseConfigured } from './services/supabase';
import ConfigMissing from './components/ConfigMissing';
import PublicLayout from './components/PublicLayout';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToHash from './components/ScrollToHash';
import SkipLink from './components/SkipLink';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReportComplaint from './pages/ReportComplaint';
import TrackComplaint from './pages/TrackComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import { Contact, Privacy, Terms } from './pages/LegalPages';
import NotFound from './pages/NotFound';
import Chatbot from './components/chatbot/Chatbot';

export default function App() {
  if (!isSupabaseConfigured) return <ConfigMissing />;

  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SkipLink />
          <ScrollToHash />
          <Chatbot />
          <Routes>
            {/* Public pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Any signed-in user */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<CitizenDashboard />} />
              <Route path="/report" element={<ReportComplaint />} />
              <Route path="/track" element={<TrackComplaint />} />
              <Route path="/complaints/:id" element={<ComplaintDetails />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admins only */}
            <Route element={<ProtectedRoute role="admin"><AppLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route element={<PublicLayout />}>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
