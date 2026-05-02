import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Logger from './pages/Logger';
import Journal from './pages/Journal';
import Login from './pages/Login';
import Register from './pages/Register';
import Toast from './components/Toast';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MusicPlayer from './components/MusicPlayer';
import Chatbot from './components/Chatbot';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return (
    <>
      {children}
      <Chatbot />
    </>
  );
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen text-gray-100 flex flex-col relative pb-20 md:pb-0">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 relative justify-center items-center">
              <Routes>
                <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/log" element={<ProtectedRoute><Logger /></ProtectedRoute>} />
                <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Toast />
            <MusicPlayer />
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App;

