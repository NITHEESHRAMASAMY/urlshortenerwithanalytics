import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import TiltCard from '../components/TiltCard';
import MagneticButton from '../components/MagneticButton';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Link2, 
  Sparkles, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap, 
  Copy, 
  Check, 
  Settings2,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;

    setLoading(true);
    setError('');
    setShortenedUrl(null);
    setCopied(false);

    try {
      const payload = { originalUrl };
      if (alias) payload.alias = alias;
      if (expiryDate) payload.expiryDate = expiryDate;

      const { data } = await axios.post('/urls/shorten', payload);
      setShortenedUrl(data.shortUrl);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to shorten URL. Check syntax.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortenedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-rich-black flex flex-col justify-between">
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
          {/* Ambient Background Glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-green/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            
            {/* Tagline Badge */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-green/30 bg-emerald-green/5 px-3 py-1 text-xs font-semibold text-emerald-green tracking-wide uppercase mb-6"
            >
              <Sparkles className="h-3 w-3 text-luxury-gold animate-pulse" />
              <span>NexLink v1.0 Launching Now</span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="font-outfit text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight"
            >
              Transform Every Click <br />
              <span className="bg-gradient-to-r from-emerald-green via-white to-luxury-gold bg-clip-text text-transparent">
                Into Real Intelligence
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto font-light"
            >
              NexLink creates smart links that capture rich audience demographics, optimize traffic flows, and drive intelligent growth in one unified workspace.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <Link to="/signup">
                <MagneticButton className="px-6 py-3 rounded-lg text-sm font-bold text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_30px_rgba(251,191,36,0.4)] transition-all">
                  Get Started For Free
                </MagneticButton>
              </Link>
              <Link to="/login">
                <button className="flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-white transition-all">
                  <span>Access Dashboard</span>
                  <ArrowRight className="h-4 w-4 text-luxury-gold" />
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Shortener Card (Interactive Guest Tester) */}
        <section className="mx-auto max-w-3xl px-4 pb-20 relative z-20">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          >
            <TiltCard glowColor="rgba(251, 191, 36, 0.08)">
              <div className="text-center mb-6">
                <h2 className="font-outfit text-2xl font-bold text-white tracking-tight">
                  Shorten Your Link
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Generate smart links and unlock powerful analytics.
                </p>
              </div>

              <form onSubmit={handleShorten} className="space-y-4">
                
                {/* Long URL Input */}
                <div>
                  <label htmlFor="url" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Long URL
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Link2 className="h-5 w-5 text-neutral-500" />
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

                {/* Advanced Settings Toggle */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center space-x-1 text-xs text-neutral-500 hover:text-luxury-gold font-medium transition-colors"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>{showAdvanced ? 'Hide Advanced Options' : 'Custom Alias & Expiry'}</span>
                  </button>
                </div>

                {/* Advanced Fields */}
                {showAdvanced && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-800/40"
                  >
                    {/* Custom Alias */}
                    <div>
                      <label htmlFor="alias" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Custom Alias (Optional)
                      </label>
                      <input
                        type="text"
                        id="alias"
                        placeholder="e.g. promo2026"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-emerald-green focus:outline-none transition-all"
                      />
                    </div>

                    {/* Expiry Date */}
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
                  </motion.div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full select-none py-3 px-4 rounded-lg font-bold text-sm text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-rich-black border-t-transparent" />
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-rich-black" />
                        <span>Generate URL</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Shortened URL Output Display */}
              {shortenedUrl && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 p-4 rounded-lg border border-neutral-800 bg-[#0D0D0D] flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="w-full text-center sm:text-left overflow-hidden">
                    <p className="text-xs text-neutral-500 font-medium">Shortened Link Generated</p>
                    <a 
                      href={shortenedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm font-bold text-luxury-gold hover:text-emerald-green underline transition-colors break-all"
                    >
                      {shortenedUrl}
                    </a>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center space-x-1.5 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
                      copied 
                        ? 'bg-emerald-green/20 text-emerald-green border border-emerald-green/30' 
                        : 'bg-neutral-800 text-slate-300 border border-neutral-700/50 hover:bg-neutral-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Guest notice */}
              {shortenedUrl && (
                <p className="text-[10px] text-neutral-500 text-center mt-3 font-medium">
                  💡 <Link to="/signup" className="text-emerald-green underline hover:text-luxury-gold">Create a free account</Link> to secure custom aliases and track click analytics!
                </p>
              )}

            </TiltCard>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-neutral-900 bg-[#080808]/40">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Engineered For Dynamic Control
            </h2>
            <p className="text-sm text-neutral-400 mt-3 font-light">
              We make shortening URLs simple and powerful. Gain unmatched edge and control with built-in telemetry features.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            
            {/* Feature 1 */}
            <motion.div variants={itemVariants}>
              <TiltCard className="h-full" glowColor="rgba(16, 185, 129, 0.1)">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-green/10 text-emerald-green border border-emerald-green/20 mb-6">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-outfit">Detailed Visitor Analytics</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Track browsers, device configurations, originating IP addresses, and timestamps instantly for every click.
                </p>
              </TiltCard>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={itemVariants}>
              <TiltCard className="h-full" glowColor="rgba(251, 191, 36, 0.1)">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 mb-6">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-outfit">Branded Custom Aliases</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Build brand identity by replacing random letters with custom marketing phrases optimized for campaigns.
                </p>
              </TiltCard>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={itemVariants}>
              <TiltCard className="h-full" glowColor="rgba(16, 185, 129, 0.1)">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-green/10 text-emerald-green border border-emerald-green/20 mb-6">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-outfit">Secure Expiry Windows</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Set custom dates and hours where links automatically deactivate, ensuring sensitive files are protected.
                </p>
              </TiltCard>
            </motion.div>

          </motion.div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
