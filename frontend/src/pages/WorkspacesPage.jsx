import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
import { 
  Folder, 
  FolderPlus, 
  Trash2, 
  Plus, 
  Link2, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronRight,
  Sparkles,
  QrCode,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WorkspacesPage = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null); // workspace object or null for general
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchWorkspaces = async () => {
    try {
      const { data } = await axios.get('/workspaces');
      setWorkspaces(data);
      if (data.length > 0 && !activeWorkspace) {
        // Default to first workspace
        setActiveWorkspace(data[0]);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError('Could not retrieve workspaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceUrls = async (workspaceId) => {
    setUrlsLoading(true);
    try {
      const { data } = await axios.get('/urls', {
        params: { workspaceId: workspaceId || 'none' }
      });
      setUrls(data.urls);
    } catch (err) {
      console.error('Failed to load URLs:', err);
    } finally {
      setUrlsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      fetchWorkspaceUrls(activeWorkspace.id);
    } else if (workspaces.length === 0 && !loading) {
      // Fetch URLs with no workspace assigned
      fetchWorkspaceUrls(null);
    }
  }, [activeWorkspace, workspaces, loading]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreateLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/workspaces', { name: newWorkspaceName });
      setWorkspaces(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setActiveWorkspace(data);
      setNewWorkspaceName('');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create workspace';
      setError(errMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWorkspace = async (id, name) => {
    const defaults = ['Marketing', 'Business', 'Personal', 'Projects'];
    if (defaults.includes(name)) {
      alert('Default workspaces cannot be deleted');
      return;
    }

    if (!window.confirm(`Delete the workspace "${name}"? Links inside it will not be deleted.`)) return;

    try {
      await axios.delete(`/workspaces/${id}`);
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(remaining[0] || null);
      }
    } catch (err) {
      alert('Failed to delete workspace');
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
          <span className="text-neutral-400">Workspaces</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Workspace Folders Panel */}
          <div className="w-full md:w-64 shrink-0 space-y-6">
            <div className="p-5 rounded-xl border border-neutral-900 bg-[#0C0C0C]">
              <h3 className="font-outfit text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-luxury-gold" />
                <span>Workspaces</span>
              </h3>

              <div className="space-y-1">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ) : workspaces.length === 0 ? (
                  <p className="text-xs text-neutral-600">No workspaces yet</p>
                ) : (
                  workspaces.map((ws) => {
                    const isActive = activeWorkspace?.id === ws.id;
                    const isDefault = ['Marketing', 'Business', 'Personal', 'Projects'].includes(ws.name);
                    return (
                      <div 
                        key={ws.id}
                        onClick={() => setActiveWorkspace(ws)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-gradient-to-r from-emerald-green/10 to-luxury-gold/5 text-white border border-emerald-green/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Folder className={`h-4 w-4 shrink-0 ${isActive ? 'text-luxury-gold' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                          <span className="truncate">{ws.name}</span>
                        </div>
                        
                        {!isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(ws.id, ws.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-all"
                            title="Delete Folder"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create Workspace Form */}
              <form onSubmit={handleCreateWorkspace} className="mt-5 pt-4 border-t border-neutral-900 space-y-2">
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="text"
                    required
                    placeholder="New workspace..."
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] py-1.5 px-3 text-xs text-white placeholder-neutral-500 focus:border-emerald-green focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createLoading || !newWorkspaceName.trim()}
                  className="w-full py-1.5 px-3 rounded-lg font-bold text-xs text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:opacity-95 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create</span>
                </button>
                {error && <p className="text-[10px] text-red-400 font-semibold">{error}</p>}
              </form>

            </div>
          </div>

          {/* Links inside Workspace */}
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
                <span>{activeWorkspace ? activeWorkspace.name : 'General Links'}</span>
                <span className="text-xs bg-neutral-850 text-neutral-400 py-0.5 px-2 rounded-full font-medium">
                  {urls.length} links
                </span>
              </h2>
            </div>

            {urlsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : urls.length === 0 ? (
              <div className="text-center py-20 rounded-xl border border-dashed border-neutral-900 bg-[#0C0C0C]/30 text-neutral-500">
                <Folder className="h-12 w-12 mx-auto text-neutral-800 mb-3 animate-pulse" />
                <p className="text-sm font-medium">No links in this workspace yet</p>
                <p className="text-xs text-neutral-600 mt-1">Move links from your dashboard folder to populate this view.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {urls.map((url) => (
                    <motion.div
                      key={url.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-4 rounded-xl border border-neutral-900 bg-[#0C0C0C] flex flex-col md:flex-row items-center justify-between gap-4 hover:border-neutral-850 hover:bg-[#0D0D0D] transition-all"
                    >
                      <div className="w-full truncate">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-luxury-gold">/{url.shortCode}</span>
                          <span className="text-[10px] bg-neutral-800 text-neutral-400 py-0.5 px-2 rounded font-medium">
                            {url.clicks} clicks
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 truncate mt-1">{url.originalUrl}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {/* Copy Link */}
                        <button
                          onClick={() => copyToClipboard(url.shortUrl, url.id)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            copiedId === url.id
                              ? 'bg-emerald-green/10 border-emerald-green/30 text-emerald-green'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title="Copy Link"
                        >
                          {copiedId === url.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>

                        {/* Visit */}
                        <a 
                          href={url.shortUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 rounded-lg border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-luxury-gold transition-all"
                          title="Visit Link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        {/* Analytics Link */}
                        <Link to={`/analytics/${url.id}`}>
                          <button className="py-2 px-3 rounded-lg border bg-neutral-900 border-neutral-800 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer">
                            Analytics
                          </button>
                        </Link>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
};

export default WorkspacesPage;
