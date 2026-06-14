import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  Clock, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Info,
  Calendar,
  Layers,
  ExternalLink,
  ShieldAlert,
  Compass,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Count-up helper
const CountUpMetric = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseInt(value, 10);
    if (isNaN(end) || end === 0) {
      setCount(0);
      return;
    }

    // Start from 1 if final target is >= 1, otherwise start from 0
    let start = end >= 1 ? 1 : 0;
    setCount(start);

    const duration = 800;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = (end - start) / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
};

// Mask IP Address for public privacy
const maskIp = (ip) => {
  if (!ip) return 'Unknown';
  if (ip === '127.0.0.1' || ip === '::1') return 'Localhost';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.slice(0, 12) + '...';
};

const PublicAnalyticsPage = () => {
  const { shortCode } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('daily'); // daily, weekly, monthly
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Password Lock state
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    const fetchPublicAnalytics = async () => {
      try {
        const savedPassword = sessionStorage.getItem(`nexlink_unlock_${shortCode}`);
        const config = {};
        if (savedPassword) {
          config.params = { password: savedPassword };
        }

        const { data: responseData } = await axios.get(`/urls/public/${shortCode}/analytics`, config);
        setData(responseData);
        setIsLocked(false);
      } catch (err) {
        if (err.response?.status === 401 && err.response?.data?.isPasswordProtected) {
          setIsLocked(true);
          setError('');
        } else {
          const errMsg = err.response?.data?.message || 'Failed to fetch public analytics for this URL';
          setError(errMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicAnalytics();
  }, [shortCode]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockLoading(true);
    setUnlockError('');

    try {
      const { data: responseData } = await axios.get(`/urls/public/${shortCode}/analytics`, {
        params: { password: unlockPassword }
      });
      sessionStorage.setItem(`nexlink_unlock_${shortCode}`, unlockPassword);
      setData(responseData);
      setIsLocked(false);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Incorrect password. Access denied.';
      setUnlockError(errMsg);
    } finally {
      setUnlockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rich-black flex flex-col justify-between">
        <nav className="border-b border-neutral-800 bg-rich-black/75 py-4 px-8 flex justify-between items-center">
          <span className="font-outfit text-lg font-bold text-white">Nex<span className="text-luxury-gold">Link</span> public</span>
        </nav>
        <main className="flex-grow mx-auto max-w-7xl w-full px-4 py-10 space-y-6">
          <Skeleton className="h-8 w-48 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-rich-black flex flex-col justify-between">
        <nav className="border-b border-neutral-850 bg-[#070707] py-4 px-8 flex justify-between items-center">
          <Link to="/" className="font-outfit text-lg font-bold text-white">Nex<span className="text-luxury-gold">Link</span></Link>
          <span className="text-[10px] bg-neutral-850 text-neutral-400 py-0.5 px-2 rounded-full font-medium">
            Protected Telemetry
          </span>
        </nav>
        
        <main className="flex-grow flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0C0C0C]/85 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-outfit text-xl font-bold text-white">Password Protected Link</h2>
                <p className="text-[10px] text-neutral-550 mt-1 max-w-xs leading-relaxed">
                  This public analytics dashboard is restricted. Enter the campaign passcode to gain access.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="w-full space-y-4 pt-2">
                <div>
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="password"
                      placeholder="Enter access password"
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      required
                      className="block w-full rounded-lg border border-neutral-850 bg-neutral-950 py-3 px-4 text-center text-sm text-white placeholder-neutral-700 focus:border-luxury-gold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {unlockError && (
                  <motion.p 
                    initial={{ x: -10 }}
                    animate={{ x: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="text-[10px] text-red-400 font-semibold text-center"
                  >
                    {unlockError}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={unlockLoading}
                  className="w-full py-3 px-4 rounded-lg font-bold text-sm text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {unlockLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rich-black border-t-transparent" />
                  ) : (
                    <span>Unlock Analytics</span>
                  )}
                </button>
              </form>

              <Link to="/" className="text-[10px] text-neutral-500 hover:text-white transition-colors pt-2">
                Return to NexLink Home
              </Link>
            </div>
          </motion.div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-rich-black flex flex-col justify-between">
        <nav className="border-b border-neutral-800 bg-rich-black/75 py-4 px-8 flex justify-between items-center">
          <Link to="/" className="font-outfit text-lg font-bold text-white">Nex<span className="text-luxury-gold">Link</span></Link>
        </nav>
        <main className="flex-grow flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-white">Link Statistics Unavailable</h2>
          <p className="text-xs text-neutral-500 max-w-xs mt-2">{error || 'This URL may be private, expired, or removed.'}</p>
          <Link to="/" className="mt-6">
            <button className="px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white transition-all text-sm font-semibold">
              Return Home
            </button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data || typeof data !== 'object' || !data.urlInfo || !data.analytics) {
    return (
      <div className="min-h-screen bg-rich-black flex flex-col justify-between">
        <nav className="border-b border-neutral-800 bg-rich-black/75 py-4 px-8 flex justify-between items-center">
          <Link to="/" className="font-outfit text-lg font-bold text-white">Nex<span className="text-luxury-gold">Link</span></Link>
        </nav>
        <main className="flex-grow flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-white">Link Statistics Unavailable</h2>
          <p className="text-xs text-neutral-500 max-w-xs mt-2">Invalid or missing analytics data.</p>
          <Link to="/" className="mt-6">
            <button className="px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white transition-all text-sm font-semibold">
              Return Home
            </button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { urlInfo, analytics } = data;
  const recentVisits = analytics.recentVisits || [];
  const chartData = analytics.trends?.[activeTab] || [];

  // Group splits for progress bars
  const deviceCounts = {};
  const browserCounts = {};
  const referrerCounts = {};
  const countryCounts = {};

  recentVisits.forEach(v => {
    deviceCounts[v.device] = (deviceCounts[v.device] || 0) + 1;
    browserCounts[v.browser] = (browserCounts[v.browser] || 0) + 1;
    referrerCounts[v.referrer] = (referrerCounts[v.referrer] || 0) + 1;
    countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
  });

  const totalHits = recentVisits.length;

  return (
    <div className="min-h-screen bg-rich-black flex flex-col justify-between">
      
      {/* Public Header */}
      <nav className="border-b border-neutral-850 bg-rich-black/75 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link to="/" className="font-outfit text-lg font-bold text-white">
                Nex<span className="text-luxury-gold">Link</span>
              </Link>
              <span className="text-[10px] bg-neutral-800 text-neutral-400 py-0.5 px-2 rounded-full font-medium">
                Public Telemetry
              </span>
            </div>
            <Link to="/" className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Create Your Own Link</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Target Details */}
        <div className="mb-8 p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C]">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Target Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <span className="text-neutral-600 block mb-1">Target original URL</span>
              <p className="text-slate-400 break-all select-all bg-neutral-950/40 p-2.5 rounded border border-neutral-900/50">{urlInfo.originalUrl}</p>
            </div>
            <div>
              <span className="text-neutral-600 block mb-1">Shortened NexLink</span>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-950/40 border border-neutral-900/50">
                <a 
                  href={urlInfo.shortUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-luxury-gold font-bold hover:underline truncate"
                >
                  {urlInfo.shortUrl}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <TiltCard glowColor="rgba(16, 185, 129, 0.08)">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-green/10 text-emerald-green border border-emerald-green/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Clicks</p>
                <h3 className="font-outfit text-3xl font-extrabold text-white mt-0.5 animate-pulse">
                  <CountUpMetric value={analytics.totalClicks} />
                </h3>
              </div>
            </div>
          </TiltCard>

          <div onClick={() => analytics.lastVisit && setShowHistoryModal(true)} className={analytics.lastVisit ? "cursor-pointer" : ""}>
            <TiltCard glowColor="rgba(251, 191, 36, 0.08)" className={analytics.lastVisit ? "hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(251,191,36,0.05)] transition-all" : ""}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Last Click Visit</p>
                    <h3 className="text-xs font-bold text-slate-200 mt-1 truncate">
                      {analytics.lastVisit 
                        ? new Date(analytics.lastVisit).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) 
                        : 'No visits yet'}
                    </h3>
                  </div>
                </div>
                {analytics.lastVisit && (
                  <span className="text-[9px] font-bold text-luxury-gold bg-luxury-gold/5 px-2 py-0.5 rounded border border-luxury-gold/10 hover:bg-luxury-gold/10 transition-all">
                    View Logs
                  </span>
                )}
              </div>
            </TiltCard>
          </div>

          <TiltCard glowColor="rgba(16, 185, 129, 0.08)">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 text-neutral-400 border border-neutral-700/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Expiration Date</p>
                <h3 className="text-xs font-bold text-slate-200 mt-1">
                  {urlInfo.expiryDate ? (
                    new Date(urlInfo.expiryDate) < new Date() ? (
                      <span className="text-red-400 font-semibold">Expired</span>
                    ) : (
                      <span>{new Date(urlInfo.expiryDate).toLocaleDateString()}</span>
                    )
                  ) : (
                    <span className="text-neutral-500">Infinite Session</span>
                  )}
                </h3>
              </div>
            </div>
          </TiltCard>

        </div>

        {/* Recharts Analytics click trends area card */}
        <div className="p-6 rounded-xl border border-neutral-900 bg-[#0C0C0C] mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider">Click Traffic History</h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">Visualize your link activity trends across time intervals.</p>
            </div>
            
            {/* Chart toggle buttons */}
            <div className="flex space-x-1 bg-neutral-950 p-1 border border-neutral-900 rounded-lg text-xs font-bold">
              {['daily', 'weekly', 'monthly'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-1 px-3 rounded capitalize transition-all ${
                    activeTab === tab 
                      ? 'bg-gradient-to-r from-emerald-green to-luxury-gold text-rich-black' 
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pr-4">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-600">No chart data points.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161616" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{ backgroundColor: '#121212', borderColor: '#222', color: '#fff', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="clicks" fill="#10B981" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Telemetry Distributions split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          
          {/* Devices and Referrers */}
          <div className="p-6 rounded-xl border border-neutral-900 bg-[#0C0C0C] space-y-6">
            <div>
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <Smartphone className="h-4 w-4 text-emerald-green" />
                <span>Device Split</span>
              </h3>
              <div className="space-y-3">
                {Object.keys(deviceCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No telemetry logged yet</p>
                ) : (
                  Object.keys(deviceCounts).map(dev => {
                    const pct = totalHits > 0 ? Math.round((deviceCounts[dev] / totalHits) * 100) : 0;
                    return (
                      <div key={dev} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span className="capitalize">{dev}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-green h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <Compass className="h-4 w-4 text-luxury-gold" />
                <span>Referrer Sources</span>
              </h3>
              <div className="space-y-3">
                {Object.keys(referrerCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No referrer data logged yet</p>
                ) : (
                  Object.keys(referrerCounts).slice(0, 4).map(ref => {
                    const pct = totalHits > 0 ? Math.round((referrerCounts[ref] / totalHits) * 100) : 0;
                    return (
                      <div key={ref} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span className="truncate max-w-[150px]">{ref}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-luxury-gold h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Browsers and Geo splits */}
          <div className="p-6 rounded-xl border border-neutral-900 bg-[#0C0C0C] space-y-6">
            <div>
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <Globe className="h-4 w-4 text-emerald-green" />
                <span>Top Browser Split</span>
              </h3>
              <div className="space-y-3">
                {Object.keys(browserCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No browser data logged</p>
                ) : (
                  Object.keys(browserCounts).slice(0, 4).map(brow => {
                    const pct = totalHits > 0 ? Math.round((browserCounts[brow] / totalHits) * 100) : 0;
                    return (
                      <div key={brow} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span>{brow}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-green h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <Globe className="h-4 w-4 text-luxury-gold" />
                <span>Geographic Countries</span>
              </h3>
              <div className="space-y-3">
                {Object.keys(countryCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No location data logged</p>
                ) : (
                  Object.keys(countryCounts).slice(0, 4).map(coun => {
                    const pct = totalHits > 0 ? Math.round((countryCounts[coun] / totalHits) * 100) : 0;
                    return (
                      <div key={coun} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span>{coun === 'IN' ? '🇮🇳 India' : coun === 'US' ? '🇺🇸 United States' : coun}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-luxury-gold h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Public Activity table (masked visitor logs) */}
        <h2 className="font-outfit text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <span>Public Activity logs</span>
          <span className="text-[10px] text-neutral-500 font-sans font-medium uppercase tracking-wider">
            Visitor IPs masked for privacy
          </span>
        </h2>

        {recentVisits.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-900 bg-[#0C0C0C]/50 text-neutral-600 rounded-xl text-xs">
            <Layers className="h-8 w-8 mx-auto text-neutral-700 mb-2" />
            No clicks recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0C0C0C]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#070707] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6">IP Address (Masked)</th>
                    <th className="py-3 px-6">Location</th>
                    <th className="py-3 px-6">Browser/OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-xs font-medium text-neutral-400">
                  {recentVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-neutral-900/10 transition-colors">
                      <td className="py-3 px-6 text-neutral-300">
                        {new Date(visit.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 font-mono text-neutral-600">
                        {maskIp(visit.ip)}
                      </td>
                      <td className="py-3 px-6">
                        {visit.city || 'Unknown'}, {visit.country || 'Unknown'}
                      </td>
                      <td className="py-3 px-6 truncate">
                        {visit.browser} on {visit.os} ({visit.device})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Public Visit History Modal */}
        <AnimatePresence>
          {showHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistoryModal(false)}
                className="absolute inset-0 bg-rich-black/80 backdrop-blur-sm transition-opacity" 
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative z-10 w-full max-w-lg rounded-xl border border-neutral-800 bg-[#121212] p-6 shadow-2xl flex flex-col max-h-[80vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div>
                    <h3 className="font-outfit text-lg font-bold text-white">Visit History Log</h3>
                    <p className="text-[10px] text-neutral-550 font-medium">Public access history with IPs masked for privacy.</p>
                  </div>
                  <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                  {recentVisits.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 text-xs">
                      No visits recorded yet.
                    </div>
                  ) : (
                    recentVisits.map((visit, index) => (
                      <div 
                        key={visit.id} 
                        className="p-3 rounded-lg border border-neutral-900 bg-[#070707] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-neutral-600 font-mono w-6 text-right">#{recentVisits.length - index}</span>
                          <div>
                            <p className="font-bold text-white">
                              {new Date(visit.timestamp).toLocaleString(undefined, { 
                                dateStyle: 'medium', 
                                timeStyle: 'medium' 
                              })}
                            </p>
                            <p className="text-[10px] text-neutral-550 mt-0.5">
                              IP: <span className="font-mono text-neutral-500">{maskIp(visit.ip)}</span> &bull; {visit.city || 'Unknown'}, {visit.country || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 self-start sm:self-center ml-9 sm:ml-0">
                          <span className="bg-neutral-850 px-2 py-0.5 rounded text-[10px] text-neutral-400 font-medium border border-neutral-850">
                            {visit.browser}
                          </span>
                          <span className="bg-neutral-850 px-2 py-0.5 rounded text-[10px] text-neutral-400 font-medium border border-neutral-850">
                            {visit.os}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-4 border-t border-neutral-900 flex justify-end shrink-0">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    Close Log
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      <Footer />
    </div>
  );
};

export default PublicAnalyticsPage;
