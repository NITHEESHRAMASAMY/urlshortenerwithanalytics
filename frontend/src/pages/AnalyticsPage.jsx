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
  ArrowLeft, 
  BarChart3, 
  Clock, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Compass,
  Laptop,
  X,
  Eye,
  EyeOff,
  Save,
  Key,
  Check
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

const AnalyticsPage = () => {
  const { id } = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('daily'); // daily, weekly, monthly
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Edit Link Settings State
  const [editAlias, setEditAlias] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: responseData } = await axios.get(`/urls/${id}/analytics`);
        setData(responseData);
        // Pre-populate settings
        setEditAlias(responseData.urlInfo.shortCode || '');
        setEditExpiry(responseData.urlInfo.expiryDate ? new Date(responseData.urlInfo.expiryDate).toISOString().slice(0, 16) : '');
        setEditPassword(responseData.urlInfo.analyticsPassword || '');
      } catch (err) {
        const errMsg = err.response?.data?.message || 'Failed to fetch analytics for this URL';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const payload = {
        alias: editAlias,
        expiryDate: editExpiry || null,
        analyticsPassword: editPassword || null
      };

      const { data: responseData } = await axios.patch(`/urls/${id}/settings`, payload);
      
      // Update local state data
      setData(prev => ({
        ...prev,
        urlInfo: responseData.urlInfo
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update settings';
      setSaveError(errMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rich-black flex flex-col justify-between">
        <Navbar />
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-rich-black flex flex-col justify-between">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <Info className="h-6 w-6" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-white">Analytics Unavailable</h2>
          <p className="text-xs text-neutral-500 max-w-xs mt-2">{error || 'Unable to load link information.'}</p>
          <Link to="/dashboard" className="mt-6">
            <button className="px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white transition-all text-sm font-semibold">
              Return to Dashboard
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
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <Info className="h-6 w-6" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-white">Analytics Unavailable</h2>
          <p className="text-xs text-neutral-500 max-w-xs mt-2">Invalid or missing analytics data.</p>
          <Link to="/dashboard" className="mt-6">
            <button className="px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white transition-all text-sm font-semibold">
              Return to Dashboard
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

  // Group stats for progress bars
  const deviceCounts = {};
  const browserCounts = {};
  const osCounts = {};
  const countryCounts = {};
  const referrerCounts = {};
  const languageCounts = {};

  recentVisits.forEach(v => {
    deviceCounts[v.device] = (deviceCounts[v.device] || 0) + 1;
    browserCounts[v.browser] = (browserCounts[v.browser] || 0) + 1;
    osCounts[v.os] = (osCounts[v.os] || 0) + 1;
    countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
    referrerCounts[v.referrer] = (referrerCounts[v.referrer] || 0) + 1;
    languageCounts[v.language] = (languageCounts[v.language] || 0) + 1;
  });

  const totalHits = recentVisits.length;

  return (
    <div className="min-h-screen bg-rich-black flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 mb-6 uppercase tracking-wider">
          <Link to="/dashboard" className="hover:text-emerald-green transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-400">Link Telemetry</span>
        </div>

        {/* Header bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard">
              <button className="p-2 rounded-lg border border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="font-outfit text-2xl font-bold text-white">Link Analytics</h1>
              <p className="text-xs text-neutral-500 font-medium">Detailed access metrics for your shortened NexLink.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link to={`/public/analytics/${urlInfo.shortCode}`} target="_blank">
              <button className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all">
                <Globe className="h-3.5 w-3.5" />
                <span>Public Analytics Page</span>
              </button>
            </Link>
            <a 
              href={urlInfo.shortUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-luxury-gold hover:text-emerald-green hover:border-emerald-green/20 transition-all"
            >
              <span>Visit Short URL</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* URL Metadata Information Card */}
        {/* Settings and Target Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Target Details Card */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C] flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Target Details</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-neutral-600 text-xs block mb-1">Original Destination URL</span>
                  <p className="text-slate-300 text-xs break-all select-all bg-neutral-950/40 p-2.5 rounded border border-neutral-900/50">{urlInfo.originalUrl}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-neutral-600 text-xs block mb-1">Created Date</span>
                    <p className="text-slate-300 text-xs p-2.5 rounded bg-neutral-950/40 border border-neutral-900/50">
                      {new Date(urlInfo.createdAt).toLocaleString(undefined, { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600 text-xs block mb-1">Shortened NexLink URL</span>
                    <p className="text-luxury-gold font-bold text-xs p-2.5 rounded bg-neutral-950/40 border border-neutral-900/50 select-all font-mono">
                      {urlInfo.shortUrl}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Link Configuration / Access Settings Card */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C] flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Link Access Settings</h2>
              <form onSubmit={handleSaveSettings} className="space-y-3">
                {/* Expiry Date */}
                <div>
                  <label htmlFor="edit-expiry" className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="datetime-local"
                    id="edit-expiry"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="block w-full rounded-lg border border-neutral-850 bg-neutral-950 py-1.5 px-3 text-xs text-white focus:border-emerald-green focus:outline-none transition-all"
                  />
                </div>

                {/* Analytics Password */}
                <div>
                  <label htmlFor="edit-password" className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Public Analytics Password
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Key className="h-3 w-3 text-neutral-600" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="edit-password"
                      placeholder="Unlock code (optional)"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="block w-full rounded-lg border border-neutral-850 bg-neutral-950 py-1.5 pl-8 pr-10 text-xs text-white placeholder-neutral-650 focus:border-emerald-green focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {saveError && (
                  <p className="text-[10px] text-red-400 font-semibold">{saveError}</p>
                )}

                {saveSuccess && (
                  <p className="text-[10px] text-emerald-green font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>Settings updated successfully!</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full py-2 px-3 rounded-lg font-bold text-xs text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] disabled:opacity-40 transition-all flex items-center justify-center space-x-1 cursor-pointer mt-4"
                >
                  {saveLoading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rich-black border-t-transparent" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Access Settings</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Clicks */}
          <TiltCard glowColor="rgba(16, 185, 129, 0.08)">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-green/10 text-emerald-green border border-emerald-green/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Clicks</p>
                <h3 className="font-outfit text-3xl font-extrabold text-white mt-0.5">
                  <CountUpMetric value={analytics.totalClicks} />
                </h3>
              </div>
            </div>
          </TiltCard>

          {/* Last Visit */}
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
                        ? new Date(analytics.lastVisit).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
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

          {/* Expiry Details */}
          <TiltCard glowColor="rgba(16, 185, 129, 0.08)">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 text-neutral-400 border border-neutral-700/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Expiry Status</p>
                <h3 className="text-xs font-bold mt-1">
                  {urlInfo.expiryDate ? (
                    new Date(urlInfo.expiryDate) < new Date() ? (
                      <span className="text-red-400 font-semibold">Expired</span>
                    ) : (
                      <span className="text-emerald-green">Active (Expires {new Date(urlInfo.expiryDate).toLocaleDateString()})</span>
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

        {/* Dynamic Distributions Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Device & Browser split card */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C] space-y-6">
            <div>
              <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Smartphone className="h-4 w-4 text-emerald-green" />
                <span>Device Split</span>
              </h3>
              <div className="space-y-2.5">
                {Object.keys(deviceCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No device data</p>
                ) : (
                  Object.keys(deviceCounts).map(device => {
                    const count = deviceCounts[device];
                    const percent = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
                    return (
                      <div key={device} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span className="capitalize">{device}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-green h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Globe className="h-4 w-4 text-luxury-gold" />
                <span>Browsers</span>
              </h3>
              <div className="space-y-2.5">
                {Object.keys(browserCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No browser data</p>
                ) : (
                  Object.keys(browserCounts).slice(0, 4).map(browser => {
                    const count = browserCounts[browser];
                    const percent = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
                    return (
                      <div key={browser} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span>{browser}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-luxury-gold h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* OS & Referrer splits */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C] space-y-6">
            <div>
              <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Laptop className="h-4 w-4 text-emerald-green" />
                <span>Operating Systems</span>
              </h3>
              <div className="space-y-2.5">
                {Object.keys(osCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No OS data</p>
                ) : (
                  Object.keys(osCounts).slice(0, 4).map(osName => {
                    const count = osCounts[osName];
                    const percent = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
                    return (
                      <div key={osName} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span>{osName}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-green h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Compass className="h-4 w-4 text-luxury-gold" />
                <span>Referrers</span>
              </h3>
              <div className="space-y-2.5">
                {Object.keys(referrerCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No referrer data</p>
                ) : (
                  Object.keys(referrerCounts).slice(0, 4).map(ref => {
                    const count = referrerCounts[ref];
                    const percent = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
                    return (
                      <div key={ref} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span className="truncate max-w-[120px]">{ref}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-luxury-gold h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Location & Language split card */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C] space-y-6">
            <div>
              <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Globe className="h-4 w-4 text-emerald-green" />
                <span>Locations</span>
              </h3>
              <div className="space-y-2.5">
                {Object.keys(countryCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No country data</p>
                ) : (
                  Object.keys(countryCounts).slice(0, 4).map(coun => {
                    const count = countryCounts[coun];
                    const percent = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
                    return (
                      <div key={coun} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span>{coun === 'IN' ? '🇮🇳 India' : coun === 'US' ? '🇺🇸 United States' : coun}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-green h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Globe className="h-4 w-4 text-luxury-gold" />
                <span>Languages</span>
              </h3>
              <div className="space-y-2.5">
                {Object.keys(languageCounts).length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No language data</p>
                ) : (
                  Object.keys(languageCounts).slice(0, 4).map(lang => {
                    const count = languageCounts[lang];
                    const percent = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
                    return (
                      <div key={lang} className="text-xs">
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span className="uppercase">{lang}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-luxury-gold h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Visits Log Table (Unmasked for Owner) */}
        <h2 className="font-outfit text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <span>Visitor Telemetry Log</span>
          <span className="text-xs bg-neutral-800 text-neutral-400 py-1 px-2.5 rounded-full font-sans font-medium">
            Showing last {recentVisits.length} hits
          </span>
        </h2>

        {recentVisits.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-900 bg-[#0C0C0C]/50 text-neutral-600 rounded-xl text-xs">
            <Layers className="h-8 w-8 mx-auto text-neutral-700 mb-2" />
            No clicks recorded on this link yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0C0C0C]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#070707] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">IP Address</th>
                    <th className="py-3.5 px-6">Location</th>
                    <th className="py-3.5 px-6">Browser/OS</th>
                    <th className="py-3.5 px-6">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-xs font-medium text-neutral-400">
                  {recentVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-neutral-900/20 transition-colors">
                      <td className="py-3.5 px-6 text-neutral-300">
                        {new Date(visit.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 select-all font-mono text-neutral-500">
                        {visit.ip}
                      </td>
                      <td className="py-3.5 px-6">
                        {visit.city || 'Unknown'}, {visit.country || 'Unknown'}
                      </td>
                      <td className="py-3.5 px-6 truncate">
                        {visit.browser} / {visit.os} ({visit.device})
                      </td>
                      <td className="py-3.5 px-6 truncate max-w-[120px]" title={visit.referrer}>
                        {visit.referrer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visit History Modal */}
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
                    <p className="text-[10px] text-neutral-550 font-medium">Complete list of visitor access timestamps.</p>
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
                            <p className="text-[10px] text-neutral-500 mt-0.5">
                              IP: <span className="font-mono text-neutral-450">{visit.ip}</span> &bull; {visit.city || 'Unknown'}, {visit.country || 'Unknown'}
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

export default AnalyticsPage;
