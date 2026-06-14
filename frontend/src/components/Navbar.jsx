import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MagneticButton from './MagneticButton';
import { Link2, LayoutDashboard, LogOut, LogIn, UserPlus, Folder, Star, QrCode, Activity } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-rich-black/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo / Branding */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-green to-luxury-gold p-[1px] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300">
                <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#0A0A0A] overflow-hidden">
                  <img src={logo} alt="NexLink Logo" className="h-full w-full object-cover" />
                </div>
              </div>
              <span className="font-outfit text-xl font-bold tracking-tight text-white group-hover:bg-gradient-to-r group-hover:from-emerald-green group-hover:to-luxury-gold group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                Nex<span className="text-luxury-gold">Link</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="hidden md:inline-block text-sm text-neutral-400">
                  Welcome, <span className="text-emerald-green font-medium">{user?.name}</span>
                </span>
                
                {location.pathname !== '/dashboard' && (
                  <Link to="/dashboard">
                    <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-neutral-800/40 transition-colors">
                      <LayoutDashboard className="h-4 w-4 text-luxury-gold" />
                      <span>Dashboard</span>
                    </button>
                  </Link>
                )}

                <Link to="/workspaces">
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-neutral-800/40 transition-colors">
                    <Folder className="h-4 w-4 text-luxury-gold" />
                    <span className="hidden lg:inline">Workspaces</span>
                  </button>
                </Link>

                <Link to="/favorites">
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-neutral-800/40 transition-colors">
                    <Star className="h-4 w-4 text-luxury-gold" />
                    <span className="hidden lg:inline">Favorites</span>
                  </button>
                </Link>

                <Link to="/qr-gallery">
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-neutral-800/40 transition-colors">
                    <QrCode className="h-4 w-4 text-luxury-gold" />
                    <span className="hidden lg:inline">QR Gallery</span>
                  </button>
                </Link>

                <Link to="/activity-log">
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-neutral-800/40 transition-colors">
                    <Activity className="h-4 w-4 text-luxury-gold" />
                    <span className="hidden lg:inline">Activity Feed</span>
                  </button>
                </Link>

                <MagneticButton 
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </MagneticButton>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-neutral-800/40 transition-colors">
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </button>
                </Link>

                <Link to="/signup">
                  <MagneticButton 
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(251,191,36,0.3)] hover:scale-102 transition-all duration-300"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Get Started</span>
                  </MagneticButton>
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
