import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Browse from './pages/Browse';
import ServiceDetail from './pages/ServiceDetail';
import PostService from './pages/PostService';
import Dashboard from './pages/Dashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Messages from './pages/Messages';
import SellerProfile from './pages/SellerProfile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import GenderModal from './components/GenderModal';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminUsers from './pages/admin/AdminUsers';
import AdminServices from './pages/admin/AdminServices';
import AdminPayouts from './pages/admin/AdminPayouts';

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Cosen';

    if (path === '/') title = 'Cosen | Campus Marketplace';
    else if (path === '/login') title = 'Log in | Cosen';
    else if (path === '/signup') title = 'Sign up | Cosen';
    else if (path === '/browse') title = 'Browse Services | Cosen';
    else if (path === '/services/new') title = 'Post a Service | Cosen';
    else if (path.startsWith('/services/')) title = 'Service Details | Cosen';
    else if (path === '/dashboard') title = 'Dashboard | Cosen';
    else if (path === '/profile') title = 'My Profile | Cosen';
    else if (path.startsWith('/profile/')) title = 'User Profile | Cosen';
    else if (path.startsWith('/orders/')) title = 'Order Details | Cosen';
    else if (path === '/messages') title = 'Messages | Cosen';
    else if (path === '/onboarding') title = 'Complete Profile | Cosen';
    else if (path === '/verify-email') title = 'Verify Email | Cosen';
    else if (path === '/forgot-password' || path.startsWith('/reset-password')) title = 'Reset Password | Cosen';
    else if (path.startsWith('/admin')) title = 'Admin Panel | Cosen';

    document.title = title;
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <TitleUpdater />
      <Routes>
        {/* ── Admin panel — uses its own full-screen layout (no Navbar) ── */}
        <Route path="/admin/*" element={
          <AdminRoute>
            <AdminLayout>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="disputes" element={<AdminDisputes />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="payouts" element={<AdminPayouts />} />
              </Routes>
            </AdminLayout>
          </AdminRoute>
        } />

        {/* ── Regular student app — uses the standard Navbar layout ── */}
        <Route path="/*" element={
          <>
            <GenderModal />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
                  <Route path="/services/new" element={<ProtectedRoute><PostService /></ProtectedRoute>} />
                  <Route path="/services/:id" element={<ProtectedRoute><ServiceDetail /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/profile/:id" element={<ProtectedRoute><SellerProfile /></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                  <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  <Route path="/verify-email" element={<ProtectedRoute><VerifyEmail /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                </Routes>
              </main>
            </div>
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;
