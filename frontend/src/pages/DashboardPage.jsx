import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TiltCard from '../components/TiltCard';
import MagneticButton from '../components/MagneticButton';
import Skeleton from '../components/Skeleton';
import QRCodeModal from '../components/QRCodeModal';
import { 
  Link2, 
  Plus, 
  BarChart3, 
  Trash2, 
  Copy, 
  Check, 
  Calendar, 
  Sparkles, 
  ExternalLink,
  Settings2,
  AlertCircle,
  QrCode,
  Search,
  Filter,
  ArrowUpDown,
  Activity,
  Users,
  TrendingUp,
  Award,
  Globe,
  Star,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Count-Up Metric Animation Component
const CountUpMetric = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseFloat(value);
    if (isNaN(end) || end === 0) {
      setCount(0);
      return;
    }

    // Start from 1 if final target is >= 1, otherwise start from 0
    let start = end >= 1 ? 1 : 0;
    setCount(start);

    const duration = 800; // ms
    const stepTime = 20; // ms
    const totalSteps = duration / stepTime;
    const increment = (end - start) / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        // Round intermediate steps if target is an integer
        setCount(Number.isInteger(end) ? Math.floor(start) : start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  // Handle decimals for Daily Visits
  const displayValue = Number.isInteger(count) ? count.toLocaleString() : count.toFixed(2);
  return <span>{displayValue}</span>;
};

const DashboardPage = () => {
  const navigate = useNavigate();

  // Shortener form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [analyticsPassword, setAnalyticsPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shortenLoading, setShortenLoading] = useState(false);
  const [shortenError, setShortenError] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState(null);

  // QR Code Modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrCode, setQrCode] = useState('');

  // Dashboard filter & query state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 });

  // Data state
  const [urls, setUrls] = useState([]);
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, activeLinks: 0, expiredLinks: 0, averageDailyVisits: 0 });
  const [leaderboard, setLeaderboard] = useState({ mostClicked: [], fastestGrowing: [] });
  
  // Real-time states
  const [liveVisitors, setLiveVisitors] = useState(1);
  const [activityFeed, setActivityFeed] = useState([]);

  // Workspaces list
  const [workspaces, setWorkspaces] = useState([]);

  // Bulk Upload states
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState('');

  // Notes states
  const [activeNoteUrlId, setActiveNoteUrlId] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch paginated URLs list
  const fetchUrls = async () => {
    try {
      const { data } = await axios.get('/urls', {
        params: {
          search,
          status: statusFilter,
          sortBy,
          order: sortOrder,
          page,
          limit
        }
      });
      setUrls(data.urls);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load user URLs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Workspaces list
  const fetchWorkspaces = async () => {
    try {
      const { data } = await axios.get('/workspaces');
      setWorkspaces(data);
    } catch (err) {
      console.error('Failed to load workspaces:', err.message);
    }
  };

  // Fetch Stats & Leaderboards
  const fetchStatsAndLeaderboard = async () => {
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        axios.get('/urls/stats'),
        axios.get('/urls/leaderboard')
      ]);
      setStats(statsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) {
      console.error('Failed to load stats/leaderboard:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  // Re-fetch list when search, filters, or pagination changes
  useEffect(() => {
    fetchUrls();
  }, [search, statusFilter, sortBy, sortOrder, page]);

  // Initial fetch for stats/leaderboard & workspaces
  useEffect(() => {
    fetchStatsAndLeaderboard();
    fetchWorkspaces();
  }, []);

  // Socket.IO Setup for real-time synchronization
  useEffect(() => {
    let backendUrl = 'http://localhost:5000';
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl.startsWith('http')) {
      backendUrl = apiUrl.replace(/\/api\/?$/, '');
    }
    const socket = io(backendUrl, {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Connected to NexLink Real-Time Socket');
    });

    socket.on('live-visitors-update', (data) => {
      setLiveVisitors(data.count);
    });

    socket.on('url-click', (event) => {
      // Check if clicked link is visible in our current urls list
      setUrls(prevUrls => {
        const urlIndex = prevUrls.findIndex(u => u.id === event.shortUrlId);
        
        // If found, update statistics dynamically
        if (urlIndex !== -1) {
          // Increment clicks inside stats card
          setStats(prevStats => ({
            ...prevStats,
            totalClicks: prevStats.totalClicks + 1
          }));

          // Prepend visitor click to activity stream
          setActivityFeed(prevFeed => [
            {
              id: event.visit.id,
              shortCode: event.shortCode,
              timestamp: event.visit.timestamp,
              browser: event.visit.browser,
              device: event.visit.device,
              country: event.visit.country,
              city: event.visit.city
            },
            ...prevFeed
          ].slice(0, 5)); // Cap feed size

          // Increment clicks count in the visible table row
          return prevUrls.map(u => {
            if (u.id === event.shortUrlId) {
              return { ...u, clicks: event.totalClicks };
            }
            return u;
          });
        }
        return prevUrls;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;

    setShortenLoading(true);
    setShortenError('');
    setGeneratedUrl(null);

    try {
      const payload = { originalUrl };
      if (alias) payload.alias = alias;
      if (expiryDate) payload.expiryDate = expiryDate;
      if (analyticsPassword) payload.analyticsPassword = analyticsPassword;

      const { data } = await axios.post('/urls/shorten', payload);
      setGeneratedUrl(data);
      
      setOriginalUrl('');
      setAlias('');
      setExpiryDate('');
      setAnalyticsPassword('');
      setShowAdvanced(false);
      
      // Refresh statistics and list
      fetchUrls();
      fetchStatsAndLeaderboard();
      fetchWorkspaces();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to shorten URL. Check syntax.';
      setShortenError(errMsg);
    } finally {
      setShortenLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this short URL and all its telemetry? This cannot be undone.')) return;

    try {
      await axios.delete(`/urls/${id}`);
      fetchUrls();
      fetchStatsAndLeaderboard();
      fetchWorkspaces();
      if (generatedUrl && generatedUrl.id === id) {
        setGeneratedUrl(null);
      }
    } catch (err) {
      alert('Failed to delete URL');
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openQrModal = (url, code) => {
    setQrUrl(url);
    setQrCode(code);
    setQrOpen(true);
  };

  // Toggle favorite status
  const handleToggleFavorite = async (urlId) => {
    try {
      const { data } = await axios.patch(`/urls/${urlId}/favorite`);
      setUrls(prev => prev.map(u => u.id === urlId ? { ...u, isFavorite: data.isFavorite } : u));
    } catch (err) {
      alert('Failed to toggle favorite');
    }
  };

  // Move URL workspace folder
  const handleMoveWorkspace = async (urlId, workspaceId) => {
    try {
      await axios.patch(`/urls/${urlId}/workspace`, { workspaceId: workspaceId || null });
      setUrls(prev => prev.map(u => u.id === urlId ? { ...u, workspaceId } : u));
      fetchWorkspaces();
    } catch (err) {
      alert('Failed to move link workspace');
    }
  };

  // Notes operations
  const handleAddNote = async (urlId) => {
    if (!noteContent.trim()) return;
    try {
      const { data } = await axios.post(`/urls/${urlId}/notes`, { content: noteContent });
      setUrls(prev => prev.map(u => {
        if (u.id === urlId) {
          return { ...u, notes: [data, ...(u.notes || [])] };
        }
        return u;
      }));
      setNoteContent('');
    } catch (err) {
      alert('Failed to add note');
    }
  };

  const handleEditNote = async (urlId, noteId) => {
    if (!noteContent.trim()) return;
    try {
      const { data } = await axios.put(`/urls/${urlId}/notes/${noteId}`, { content: noteContent });
      setUrls(prev => prev.map(u => {
        if (u.id === urlId) {
          return { ...u, notes: (u.notes || []).map(n => n.id === noteId ? data : n) };
        }
        return u;
      }));
      setNoteContent('');
      setEditingNoteId(null);
    } catch (err) {
      alert('Failed to edit note');
    }
  };

  const handleDeleteNote = async (urlId, noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await axios.delete(`/urls/${urlId}/notes/${noteId}`);
      setUrls(prev => prev.map(u => {
        if (u.id === urlId) {
          return { ...u, notes: (u.notes || []).filter(n => n.id !== noteId) };
        }
        return u;
      }));
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  // Bulk CSV parser
  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setBulkError('Please select a valid CSV file (.csv).');
      setBulkFile(null);
      setBulkPreview([]);
      setBulkResult(null);
      e.target.value = ''; // Reset input
      return;
    }

    setBulkError('');
    setBulkFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;

      // Check for binary data
      if (text.includes('\u0000') || (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length > 20) {
        setBulkError('The selected file appears to be binary. Please upload a plain-text CSV file.');
        setBulkFile(null);
        setBulkPreview([]);
        setBulkResult(null);
        e.target.value = ''; // Reset input
        return;
      }

      const lines = text.split(/\r?\n/);
      const parsed = [];

      let urlColIndex = 0;
      let aliasColIndex = 1;
      let expiryColIndex = 2;
      let hasHeader = false;

      // Find first non-empty line to analyze columns
      let headerIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx !== -1) {
        const firstLineCols = lines[headerIdx].split(',').map(c => c.trim().toLowerCase());
        
        // Check if the first line is a header
        const headerKeywords = ['url', 'link', 'originalurl', 'alias', 'expiry', 'expirydate', 'date', 'id', 'sno', 'no', 'serial'];
        const matchesHeader = firstLineCols.some(col => 
          headerKeywords.some(keyword => col.includes(keyword))
        );

        if (matchesHeader) {
          hasHeader = true;
          const urlIdx = firstLineCols.findIndex(col => col.includes('url') || col.includes('link') || col.includes('original'));
          const aliasIdx = firstLineCols.findIndex(col => col.includes('alias') || col.includes('custom'));
          const expiryIdx = firstLineCols.findIndex(col => col.includes('expiry') || col.includes('date'));

          if (urlIdx !== -1) urlColIndex = urlIdx;
          if (aliasIdx !== -1) aliasColIndex = aliasIdx;
          if (expiryIdx !== -1) expiryColIndex = expiryIdx;
        } else {
          // If no header, analyze the first row columns to locate the URL
          const cols = lines[headerIdx].split(',').map(c => c.trim());
          const urlIdx = cols.findIndex(c => /^https?:\/\//i.test(c) || /^www\./i.test(c) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(c));
          if (urlIdx !== -1) {
            urlColIndex = urlIdx;
            
            // Map remaining columns
            const remainingIndices = cols.map((_, idx) => idx).filter(idx => idx !== urlIdx);
            
            // Look for date
            const expiryIdx = remainingIndices.find(idx => {
              const val = cols[idx];
              return val && !isNaN(Date.parse(val)) && (val.includes('-') || val.includes('/'));
            });
            if (expiryIdx !== undefined) expiryColIndex = expiryIdx;
            
            // Look for alias (non-numeric, not date, length >= 3)
            const aliasIdx = remainingIndices.find(idx => {
              if (idx === expiryIdx) return false;
              const val = cols[idx];
              return val && isNaN(Number(val)) && val.length >= 3;
            });
            if (aliasIdx !== undefined) aliasColIndex = aliasIdx;
          }
        }
      }

      const startLine = hasHeader ? headerIdx + 1 : headerIdx;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        let url = cols[urlColIndex]?.trim() || '';
        const alias = cols[aliasColIndex]?.trim() || '';
        const expiry = cols[expiryColIndex]?.trim() || '';

        if (url) {
          // Prepend protocol if missing but looks like a domain or www.
          if (!/^https?:\/\//i.test(url)) {
            if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url) || /^www\./i.test(url)) {
              url = 'https://' + url;
            }
          }
          parsed.push({ originalUrl: url, alias, expiryDate: expiry });
        }
      }

      if (parsed.length === 0) {
        setBulkError('No URLs found in the selected CSV file. Please make sure the URL column is correctly filled.');
        setBulkFile(null);
        setBulkPreview([]);
        e.target.value = ''; // Reset input
        return;
      }

      setBulkPreview(parsed);
      setBulkResult(null);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (bulkPreview.length === 0) return;
    setBulkLoading(true);
    try {
      const { data } = await axios.post('/urls/bulk', { urls: bulkPreview });
      setBulkResult({
        successCount: data.results.length,
        errorCount: data.errors.length,
        errors: data.errors
      });
      fetchUrls();
      fetchStatsAndLeaderboard();
      fetchWorkspaces();
      setBulkPreview([]);
      setBulkFile(null);
    } catch (err) {
      alert('Failed to process bulk upload');
    } finally {
      setBulkLoading(false);
    }
  };

  // Export actions
  const handleExportCsv = () => {
    if (urls.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Short Code,Original URL,Shortened Link,Clicks,Created Date,Workspace\n';
    
    urls.forEach(url => {
      const workspaceName = url.workspace?.name || 'General';
      const row = `"${url.shortCode}","${url.originalUrl}","${url.shortUrl}",${url.clicks},"${new Date(url.createdAt).toLocaleDateString()}","${workspaceName}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexlink-export-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (urls.length === 0) return;
    let content = 'Short Code\tOriginal URL\tShortened Link\tClicks\tCreated Date\tWorkspace\n';
    
    urls.forEach(url => {
      const workspaceName = url.workspace?.name || 'General';
      const row = `${url.shortCode}\t${url.originalUrl}\t${url.shortUrl}\t${url.clicks}\t${new Date(url.createdAt).toLocaleDateString()}\t${workspaceName}`;
      content += row + '\n';
    });

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nexlink-export-${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-rich-black flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Real-time Widget Indicator */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 p-4 rounded-xl border border-emerald-green/20 bg-emerald-green/5">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-green"></span>
            </span>
            <div className="text-xs">
              <p className="font-bold text-white uppercase tracking-wider">NexLink Real-Time Telemetry Active</p>
              <p className="text-neutral-400 mt-0.5">Your click streams and page updates synchronize instantly.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold bg-[#0C0C0C] border border-neutral-800 py-1.5 px-3 rounded-lg text-emerald-green">
            <Users className="h-4 w-4" />
            <span>Active Live Visitors: <span className="text-white text-sm ml-0.5">{liveVisitors}</span></span>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          
          {/* Total Links */}
          <TiltCard glowColor="rgba(16, 185, 129, 0.05)" className="p-4">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Links</p>
            <h3 className="font-outfit text-2xl font-extrabold text-white mt-1">
              {statsLoading ? <Skeleton className="h-8 w-12 rounded" /> : <CountUpMetric value={stats.totalLinks} />}
            </h3>
          </TiltCard>

          {/* Total Clicks */}
          <TiltCard glowColor="rgba(251, 191, 36, 0.05)" className="p-4">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Clicks</p>
            <h3 className="font-outfit text-2xl font-extrabold text-white mt-1">
              {statsLoading ? <Skeleton className="h-8 w-16 rounded" /> : <CountUpMetric value={stats.totalClicks} />}
            </h3>
          </TiltCard>

          {/* Active Links */}
          <TiltCard glowColor="rgba(16, 185, 129, 0.05)" className="p-4">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Active Links</p>
            <h3 className="font-outfit text-2xl font-extrabold text-emerald-green mt-1">
              {statsLoading ? <Skeleton className="h-8 w-12 rounded" /> : <CountUpMetric value={stats.activeLinks} />}
            </h3>
          </TiltCard>

          {/* Expired Links */}
          <TiltCard glowColor="rgba(239, 68, 68, 0.05)" className="p-4">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Expired Links</p>
            <h3 className="font-outfit text-2xl font-extrabold text-red-400 mt-1">
              {statsLoading ? <Skeleton className="h-8 w-12 rounded" /> : <CountUpMetric value={stats.expiredLinks} />}
            </h3>
          </TiltCard>

          {/* Avg Daily Visits */}
          <TiltCard glowColor="rgba(251, 191, 36, 0.05)" className="p-4">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Avg Daily Hits</p>
            <h3 className="font-outfit text-2xl font-extrabold text-luxury-gold mt-1">
              {statsLoading ? <Skeleton className="h-8 w-14 rounded" /> : <CountUpMetric value={stats.averageDailyVisits} />}
            </h3>
          </TiltCard>

        </div>

        {/* Shortener Card */}
        <div className="max-w-3xl mx-auto mb-8">
          <TiltCard glowColor="rgba(16, 185, 129, 0.08)">
            <div className="flex space-x-2 bg-neutral-950 p-1 border border-neutral-900 rounded-lg text-xs font-bold mb-6 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setBulkMode(false);
                  setBulkError('');
                  setBulkFile(null);
                  setBulkPreview([]);
                  setBulkResult(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded transition-all cursor-pointer ${
                  !bulkMode 
                    ? 'bg-gradient-to-r from-emerald-green to-luxury-gold text-rich-black' 
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                Single Shorten
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkMode(true);
                  setBulkError('');
                  setBulkFile(null);
                  setBulkPreview([]);
                  setBulkResult(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded transition-all cursor-pointer ${
                  bulkMode 
                    ? 'bg-gradient-to-r from-emerald-green to-luxury-gold text-rich-black' 
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                Bulk CSV Upload
              </button>
            </div>

            {bulkMode ? (
              <div className="space-y-4 text-left">
                <div className="border border-dashed border-neutral-800 rounded-lg p-6 text-center bg-[#070707]">
                  <input
                    type="file"
                    accept=".csv"
                    id="bulk-csv"
                    onChange={handleCsvChange}
                    className="hidden"
                  />
                  <label htmlFor="bulk-csv" className="cursor-pointer text-slate-300 hover:text-white block">
                    <p className="font-bold text-sm">Click to select CSV File</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Format: url,alias,expiryDate (e.g. https://google.com,google-alias,2026-12-31)</p>
                  </label>
                  <div className="mt-3">
                    <a
                      href="/sample_urls.csv"
                      download="sample_urls.csv"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center text-[10px] font-bold text-emerald-green hover:text-white underline transition-colors"
                    >
                      Download Sample CSV Template
                    </a>
                  </div>
                  {bulkFile && (
                    <p className="text-emerald-green font-semibold mt-2 text-xs">Selected: {bulkFile.name}</p>
                  )}
                </div>

                {bulkError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkPreview.length > 0 && (
                  <div className="p-3 rounded-lg border border-neutral-900 bg-[#0F0F0F] max-h-36 overflow-y-auto text-xs">
                    <p className="font-bold text-neutral-450 uppercase mb-2">CSV Preview ({bulkPreview.length} links found):</p>
                    <div className="space-y-1 font-mono text-[10px] text-neutral-400">
                      {bulkPreview.slice(0, 5).map((p, i) => (
                        <div key={i} className="truncate">
                          {p.originalUrl} {p.alias ? `(alias: ${p.alias})` : ''}
                        </div>
                      ))}
                      {bulkPreview.length > 5 && <p className="text-[9px] text-neutral-600">...and {bulkPreview.length - 5} more</p>}
                    </div>
                  </div>
                )}

                {bulkResult && (
                  <div className="p-3 rounded-lg border border-neutral-900 bg-[#0F0F0F] space-y-1 text-xs">
                    <p className="font-bold text-emerald-green">Bulk Upload Successful!</p>
                    <p className="text-neutral-350">Successfully shortened: <span className="font-bold text-white">{bulkResult.successCount}</span> URLs</p>
                    {bulkResult.errorCount > 0 && (
                      <div>
                        <p className="text-red-400 font-semibold mt-1">Failed to shorten: {bulkResult.errorCount} URLs</p>
                        <div className="max-h-20 overflow-y-auto space-y-0.5 mt-1 font-mono text-[9px] text-red-300">
                          {bulkResult.errors.map((err, idx) => (
                            <div key={idx} className="truncate">
                              {err.originalUrl}: {err.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={bulkLoading || bulkPreview.length === 0}
                  className="w-full py-3 px-4 rounded-lg font-bold text-sm text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {bulkLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rich-black border-t-transparent" />
                  ) : (
                    <span>Process Bulk Upload</span>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleShorten} className="space-y-4">
                <div>
                  <label htmlFor="url" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Long URL
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Link2 className="h-4 w-4 text-neutral-500" />
                    </div>
                    <input
                      type="url"
                      id="url"
                      required
                      placeholder="https://example.com/very-long-original-url"
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                      className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] py-3 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:border-emerald-green focus:outline-none focus:ring-1 focus:ring-emerald-green transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center space-x-1 text-xs text-neutral-500 hover:text-luxury-gold font-medium transition-colors"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>{showAdvanced ? 'Hide Settings' : 'Custom Alias & Expiry'}</span>
                  </button>
                </div>

                {showAdvanced && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-neutral-800/40"
                  >
                    <div>
                      <label htmlFor="alias" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Custom Alias (Optional)
                      </label>
                      <input
                        type="text"
                        id="alias"
                        placeholder="e.g. promo-code"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-emerald-green focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="expiry" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        id="expiry"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-emerald-green focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="analyticsPassword" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Analytics Password (Optional)
                      </label>
                      <input
                        type="password"
                        id="analyticsPassword"
                        placeholder="e.g. stats-pass"
                        value={analyticsPassword}
                        onChange={(e) => setAnalyticsPassword(e.target.value)}
                        className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-emerald-green focus:outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {shortenError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{shortenError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={shortenLoading}
                    className="w-full py-3 px-4 rounded-lg font-bold text-sm text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center space-x-2"
                  >
                    {shortenLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-rich-black border-t-transparent" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 stroke-[3]" />
                        <span>Generate URL</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {generatedUrl && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-6 p-4 rounded-lg border border-neutral-800 bg-[#0D0D0D] flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="w-full text-center sm:text-left overflow-hidden">
                  <p className="text-xs text-neutral-500 font-medium">Original Link:</p>
                  <p className="text-xs text-neutral-300 truncate mb-1">{generatedUrl.originalUrl}</p>
                  
                  <p className="text-xs text-neutral-500 font-medium">Shortened Link:</p>
                  <a 
                    href={generatedUrl.shortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-bold text-luxury-gold hover:text-emerald-green underline transition-colors break-all"
                  >
                    {generatedUrl.shortUrl}
                  </a>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => openQrModal(generatedUrl.shortUrl, generatedUrl.shortCode)}
                    className="p-2 rounded-lg bg-neutral-800 text-slate-300 border border-neutral-700/50 hover:bg-neutral-700 transition-colors"
                    title="Get QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedUrl.shortUrl, generatedUrl.id)}
                    className={`flex items-center space-x-1.5 py-2 px-4 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      copiedId === generatedUrl.id
                        ? 'bg-emerald-green/20 text-emerald-green border border-emerald-green/30' 
                        : 'bg-neutral-800 text-slate-300 border border-neutral-700/50 hover:bg-neutral-700'
                    }`}
                  >
                    {copiedId === generatedUrl.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(generatedUrl.id)}
                    className="p-2 rounded-lg bg-red-950/20 text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    title="Delete URL"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </TiltCard>
        </div>

        {/* Real-time Activity Feed & Leaderboards Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          {/* Real-time Activity Feed */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C] flex flex-col justify-between">
            <div>
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Activity className="h-4 w-4 text-emerald-green animate-pulse" />
                <span>Real-Time Activity Feed</span>
              </h3>
              <div className="space-y-3">
                {activityFeed.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs">
                    Waiting for incoming visitor clicks...
                  </div>
                ) : (
                  <AnimatePresence>
                    {activityFeed.map((feed) => (
                      <motion.div
                        key={feed.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-3 rounded-lg border border-neutral-800 bg-[#070707] flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="text-slate-300 font-semibold">
                            Link <span className="text-luxury-gold">/{feed.shortCode}</span> was clicked!
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            From {feed.city || 'Unknown'}, {feed.country || 'Unknown'} &bull; via {feed.browser} on {feed.device}
                          </p>
                        </div>
                        <span className="text-[10px] text-neutral-600">
                          {new Date(feed.timestamp).toLocaleTimeString()}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard Panel */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C]">
            <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Award className="h-4 w-4 text-luxury-gold" />
              <span>Link Leaderboards</span>
            </h3>
            
            <div className="space-y-6 text-xs">
              {/* Most Clicked */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-luxury-gold" />
                  <span>Most Clicked Links</span>
                </h4>
                {statsLoading ? (
                  <div className="space-y-2"><Skeleton className="h-8 w-full rounded" /></div>
                ) : leaderboard.mostClicked.length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No logs yet</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.mostClicked.slice(0, 3).map((item, idx) => (
                      <div key={item.id} className="flex justify-between items-center p-2 rounded bg-neutral-950 border border-neutral-900/60">
                        <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                          {idx + 1}. /{item.shortCode}
                        </span>
                        <span className="text-emerald-green font-bold">{item.clicks} hits</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fastest Growing */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-luxury-gold" />
                  <span>Fastest Growing</span>
                </h4>
                {statsLoading ? (
                  <div className="space-y-2"><Skeleton className="h-8 w-full rounded" /></div>
                ) : leaderboard.fastestGrowing.length === 0 ? (
                  <p className="text-[10px] text-neutral-600">No logs yet</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.fastestGrowing.slice(0, 3).map((item, idx) => (
                      <div key={item.id} className="flex justify-between items-center p-2 rounded bg-neutral-950 border border-neutral-900/60">
                        <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                          {idx + 1}. /{item.shortCode}
                        </span>
                        <span className="text-luxury-gold font-bold">{item.growthSpeed} c/day</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Search, Filter, Sort and URLs table */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
            <span>Manage Active Links</span>
            <span className="text-xs bg-neutral-800 text-neutral-400 py-1 px-2.5 rounded-full font-sans font-medium">
              {pagination.totalItems} total
            </span>
          </h2>
          
          {/* Filter Toolbar Controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Search Input */}
            <div className="relative rounded-lg shadow-sm w-full sm:w-48 md:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                <Search className="h-3.5 w-3.5 text-neutral-500" />
              </div>
              <input
                type="text"
                placeholder="Search links..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:border-emerald-green focus:outline-none transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-1.5 bg-[#0F0F0F] border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-slate-300">
              <Filter className="h-3 w-3 text-neutral-500" />
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All Links</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5 bg-[#0F0F0F] border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-slate-300">
              <ArrowUpDown className="h-3 w-3 text-neutral-500" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="clicks-desc">Most Clicked</option>
                <option value="clicks-asc">Least Clicked</option>
              </select>
            </div>

            {/* Export Actions */}
            <div className="flex items-center space-x-1.5 bg-[#0F0F0F] border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-350 no-print">
              <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider mr-1">Export:</span>
              <button 
                onClick={handleExportCsv}
                className="hover:text-luxury-gold cursor-pointer font-bold px-1 transition-colors"
              >
                CSV
              </button>
              <span className="text-neutral-800 font-light">|</span>
              <button 
                onClick={handleExportExcel}
                className="hover:text-luxury-gold cursor-pointer font-bold px-1 transition-colors"
              >
                Excel
              </button>
              <span className="text-neutral-800 font-light">|</span>
              <button 
                onClick={handleExportPdf}
                className="hover:text-luxury-gold cursor-pointer font-bold px-1 transition-colors"
              >
                PDF
              </button>
            </div>

          </div>
        </div>

        <style>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000055 !important;
            }
            nav, footer, .no-print, button, select, input {
              display: none !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
            }
            .max-w-7xl {
              max-width: 100% !important;
              width: 100% !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              color: #000000 !important;
            }
            th, td {
              border-bottom: 1px solid #ddd !important;
              color: #000000 !important;
              padding: 10px !important;
            }
          }
        `}</style>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : urls.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-neutral-800 bg-[#0F0F0F]/30 text-neutral-500">
            <Link2 className="h-12 w-12 mx-auto text-neutral-600 mb-3" />
            <p className="text-sm font-medium">No matching links found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0C0C0C]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#070707] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Original URL</th>
                    <th className="py-4 px-6">Short URL</th>
                    <th className="py-4 px-6 no-print">Workspace</th>
                    <th className="py-4 px-6">Created Date</th>
                    <th className="py-4 px-6 text-center">Clicks</th>
                    <th className="py-4 px-6 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-sm">
                  {urls.map((url) => {
                    const isExpired = url.expiryDate && new Date(url.expiryDate) < new Date();
                    return (
                      <React.Fragment key={url.id}>
                        <tr className="hover:bg-neutral-900/30 transition-colors">
                          
                          {/* Original URL */}
                          <td className="py-4 px-6 max-w-xs md:max-w-md truncate text-neutral-400">
                            {url.originalUrl}
                          </td>

                          {/* Short URL Link */}
                          <td className="py-4 px-6 font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleFavorite(url.id)}
                                className="text-neutral-500 hover:text-luxury-gold transition-colors shrink-0 cursor-pointer"
                                title={url.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                              >
                                <Star className={`h-4 w-4 ${url.isFavorite ? 'text-luxury-gold fill-current' : ''}`} />
                              </button>
                              <div className="flex flex-col space-y-0.5">
                                <a 
                                  href={url.shortUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="hover:underline flex items-center space-x-1 text-luxury-gold font-bold"
                                >
                                  <span>{url.shortCode}</span>
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </a>
                                <span className="text-[10px] text-neutral-600 font-mono">{url.shortUrl}</span>
                              </div>
                            </div>
                          </td>

                          {/* Workspace folder selector */}
                          <td className="py-4 px-6 text-xs no-print">
                            <select
                              value={url.workspaceId || ''}
                              onChange={(e) => handleMoveWorkspace(url.id, e.target.value)}
                              className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-neutral-300 focus:outline-none focus:border-emerald-green max-w-[130px] cursor-pointer"
                            >
                              <option value="">General</option>
                              {workspaces.map(ws => (
                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Created Date / Expiry state */}
                          <td className="py-4 px-6 text-xs text-neutral-500 whitespace-nowrap">
                            <p>{new Date(url.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            {url.expiryDate ? (
                              isExpired ? (
                                <span className="text-[10px] text-red-500 font-semibold uppercase">Expired</span>
                              ) : (
                                <span className="text-[10px] text-emerald-green font-semibold uppercase">Expires {new Date(url.expiryDate).toLocaleDateString()}</span>
                              )
                            ) : (
                              <span className="text-[10px] text-neutral-600 uppercase font-semibold">No expiry</span>
                            )}
                          </td>

                          {/* Click Count */}
                          <td className="py-4 px-6 text-center font-bold text-white">
                            <span className="inline-block py-0.5 px-2.5 rounded bg-neutral-800/60 text-xs">
                              {url.clicks}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right whitespace-nowrap no-print">
                            <div className="inline-flex items-center space-x-2">
                              
                              {/* Copy */}
                              <button
                                onClick={() => copyToClipboard(url.shortUrl, url.id)}
                                title="Copy Short URL"
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  copiedId === url.id
                                    ? 'bg-emerald-green/10 border-emerald-green/30 text-emerald-green'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                }`}
                              >
                                {copiedId === url.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </button>

                              {/* QR code trigger */}
                              <button
                                onClick={() => openQrModal(url.shortUrl, url.shortCode)}
                                title="Generate QR Code"
                                className="p-1.5 rounded-lg border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-luxury-gold hover:border-luxury-gold/30 hover:bg-neutral-800 transition-all cursor-pointer"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>

                              {/* Notes button */}
                              <button
                                onClick={() => {
                                  if (activeNoteUrlId === url.id) {
                                    setActiveNoteUrlId(null);
                                    setEditingNoteId(null);
                                    setNoteContent('');
                                  } else {
                                    setActiveNoteUrlId(url.id);
                                    setEditingNoteId(null);
                                    setNoteContent('');
                                  }
                                }}
                                title="View/Edit Notes"
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  activeNoteUrlId === url.id
                                    ? 'bg-emerald-green/10 border-emerald-green/30 text-emerald-green'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                              </button>

                              {/* Analytics */}
                              <Link to={`/analytics/${url.id}`}>
                                <button
                                  title="View Analytics"
                                  className="p-1.5 rounded-lg border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-luxury-gold hover:border-luxury-gold/30 hover:bg-neutral-800 transition-all cursor-pointer"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </button>
                              </Link>

                              {/* Public view shortcut */}
                              <Link to={`/public/analytics/${url.shortCode}`} target="_blank">
                                <button
                                  title="View Public Analytics"
                                  className="p-1.5 rounded-lg border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-emerald-green hover:border-emerald-green/30 hover:bg-neutral-800 transition-all cursor-pointer"
                                >
                                  <Globe className="h-4 w-4" />
                                </button>
                              </Link>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(url.id)}
                                title="Delete URL"
                                className="p-1.5 rounded-lg border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/20 hover:bg-neutral-800 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                            </div>
                          </td>

                        </tr>

                        {/* Expandable Notes Panel */}
                        {activeNoteUrlId === url.id && (
                          <tr className="bg-neutral-950/45 no-print text-left">
                            <td colSpan={6} className="py-4 px-6 border-b border-neutral-900">
                              <div className="border border-neutral-900 rounded-lg p-4 bg-[#080808]/95 space-y-4 text-xs max-w-3xl">
                                <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-luxury-gold" />
                                  <span>Notes attached to /{url.shortCode}</span>
                                </h4>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                  {(!url.notes || url.notes.length === 0) ? (
                                    <p className="text-neutral-500 italic text-[10px]">No notes found on this short link.</p>
                                  ) : (
                                    url.notes.map(note => (
                                      <div key={note.id} className="p-2.5 rounded bg-neutral-900/60 border border-neutral-855 flex justify-between items-start gap-4">
                                        <p className="text-neutral-350 whitespace-pre-wrap font-medium">{note.content}</p>
                                        <div className="flex space-x-2 shrink-0 text-[10px]">
                                          <button
                                            onClick={() => {
                                              setEditingNoteId(note.id);
                                              setNoteContent(note.content);
                                            }}
                                            className="text-emerald-green hover:underline font-bold cursor-pointer"
                                          >
                                            Edit
                                          </button>
                                          <span className="text-neutral-700">|</span>
                                          <button
                                            onClick={() => handleDeleteNote(url.id, note.id)}
                                            className="text-red-400 hover:underline font-bold cursor-pointer"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <div className="flex gap-2 items-end">
                                  <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder={editingNoteId ? "Update your note details..." : "Add a private reminder, tag, or context..."}
                                    className="flex-grow rounded border border-neutral-800 bg-[#0C0C0C] p-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-green focus:ring-1 focus:ring-emerald-green resize-none h-16"
                                  />
                                  <div className="flex flex-col gap-1.5 shrink-0">
                                    {editingNoteId && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingNoteId(null);
                                          setNoteContent('');
                                        }}
                                        className="py-1 px-2.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-bold hover:text-white transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => editingNoteId ? handleEditNote(url.id, editingNoteId) : handleAddNote(url.id)}
                                      className="py-1 px-3.5 rounded bg-gradient-to-r from-emerald-green to-luxury-gold text-rich-black text-[10px] font-bold cursor-pointer hover:opacity-95 transition-opacity"
                                    >
                                      {editingNoteId ? 'Save' : 'Add Note'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {pagination.totalPages > 1 && (
              <div className="bg-[#070707] py-3.5 px-6 border-t border-neutral-800 flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-500">
                  Page <span className="text-white">{pagination.currentPage}</span> of <span className="text-white">{pagination.totalPages}</span>
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="py-1 px-3 rounded bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white disabled:opacity-40 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="py-1 px-3 rounded bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white disabled:opacity-40 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* QR Code sharing popup */}
      <QRCodeModal 
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        shortUrl={qrUrl}
        shortCode={qrCode}
      />

      <Footer />
    </div>
  );
};

export default DashboardPage;
