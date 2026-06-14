import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TiltCard from '../components/TiltCard';
import MagneticButton from '../components/MagneticButton';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rich-black flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-green/5 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <TiltCard glowColor="rgba(251, 191, 36, 0.08)">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-outfit text-3xl font-extrabold text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-neutral-400 mt-2">
                Enter your credentials to manage your smart links.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-neutral-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:border-emerald-green focus:outline-none focus:ring-1 focus:ring-emerald-green transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-neutral-500" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:border-emerald-green focus:outline-none focus:ring-1 focus:ring-emerald-green transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <MagneticButton
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-bold text-sm text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rich-black border-t-transparent" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Authenticate Session</span>
                    </>
                  )}
                </MagneticButton>
              </div>
            </form>

            {/* Footer Signpost */}
            <div className="text-center mt-6 pt-4 border-t border-neutral-800/40 text-xs">
              <span className="text-neutral-500">New to NexLink? </span>
              <Link to="/signup" className="text-emerald-green hover:text-luxury-gold font-bold underline transition-colors">
                Register account
              </Link>
            </div>

          </TiltCard>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
