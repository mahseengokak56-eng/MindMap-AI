import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Logger from './pages/Logger';
import Toast from './components/Toast';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen text-gray-100 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/log" element={<Logger />} />
            </Routes>
          </main>
          <Toast />
        </div>
      </Router>
    </ToastProvider>
  )
}

export default App;
