import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Skeleton from '../components/Skeleton';
import { 
  Star, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FavoritesPage = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchFavoriteUrls = async () => {
    try {
      const { data } = await axios.get('/urls', {
        params: { favorite: 'true' }
      });
      setUrls(data.urls);
    } catch (err) {
      console.error('Failed to load favorite URLs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteUrls();
  }, []);

  const handleToggleFavorite = async (id) => {
    try {
      await axios.patch(`/urls/${id}/favorite`);
      // Animate removal from view immediately
      setUrls(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
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
          <span className="text-neutral-400">Favorites</span>
        </div>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-lg bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 animate-pulse">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="font-outfit text-2xl font-bold text-white flex items-center gap-2">
              <span>Favorite Links</span>
              <span className="text-xs bg-neutral-850 text-neutral-400 py-0.5 px-2 rounded-full font-medium">
                {urls.length} total
              </span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5 font-medium">Quick-access directory for starred links.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : urls.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-neutral-900 bg-[#0C0C0C]/30 text-neutral-500">
            <Star className="h-12 w-12 mx-auto text-neutral-800 mb-3" />
            <p className="text-sm font-medium">No favorite links yet</p>
            <p className="text-xs text-neutral-600 mt-1">Star your links in the dashboard to list them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {urls.map((url) => (
                <motion.div
                  key={url.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl border border-neutral-900 bg-[#0C0C0C] flex flex-col md:flex-row items-center justify-between gap-4 hover:border-neutral-850 hover:bg-[#0D0D0D] transition-all"
                >
                  <div className="w-full truncate flex items-center space-x-3">
                    <button 
                      onClick={() => handleToggleFavorite(url.id)}
                      className="p-1 rounded text-luxury-gold hover:text-neutral-500 transition-colors shrink-0"
                      title="Remove Favorite"
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">/{url.shortCode}</span>
                        <span className="text-[10px] bg-neutral-800/60 text-neutral-400 py-0.5 px-2.5 rounded font-medium">
                          {url.clicks} clicks
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-1">{url.originalUrl}</p>
                    </div>
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

                    {/* Analytics */}
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

      </main>

      <Footer />
    </div>
  );
};

export default FavoritesPage;
