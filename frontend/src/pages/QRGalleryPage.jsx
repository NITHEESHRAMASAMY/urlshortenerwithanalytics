import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Skeleton from '../components/Skeleton';
import QRCodeModal from '../components/QRCodeModal';
import { 
  QrCode, 
  Search, 
  Download, 
  Eye, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

// Inner component to render QR image on canvas context
const QRThumb = ({ url }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 130,
          margin: 1,
          color: {
            dark: '#0A0A0A',
            light: '#FBBF24'
          }
        },
        (error) => {
          if (error) console.error('Error rendering QR thumb', error);
        }
      );
    }
  }, [url]);

  return (
    <div className="p-1 rounded bg-gradient-to-r from-emerald-green via-neutral-800 to-luxury-gold shadow-md">
      <canvas ref={canvasRef} className="rounded w-[130px] h-[130px]" />
    </div>
  );
};

const QRGalleryPage = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState('');
  const [modalCode, setModalCode] = useState('');

  const fetchUrls = async () => {
    try {
      const { data } = await axios.get('/urls', {
        params: { limit: 100 } // Fetch last 100 links for the gallery
      });
      setUrls(data.urls);
    } catch (err) {
      console.error('Failed to load gallery URLs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const filteredUrls = urls.filter(url => 
    url.shortCode.toLowerCase().includes(search.toLowerCase()) ||
    (url.alias && url.alias.toLowerCase().includes(search.toLowerCase())) ||
    url.originalUrl.toLowerCase().includes(search.toLowerCase())
  );

  const triggerDownload = (shortUrl, shortCode) => {
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(
      canvas,
      shortUrl,
      {
        width: 400,
        margin: 1.5,
        color: {
          dark: '#0A0A0A',
          light: '#FBBF24'
        }
      },
      (error) => {
        if (error) {
          console.error(error);
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `nexlink-qr-${shortCode}.png`;
        link.href = dataUrl;
        link.click();
      }
    );
  };

  const openPreview = (url, code) => {
    setModalUrl(url);
    setModalCode(code);
    setModalOpen(true);
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
          <span className="text-neutral-400">QR Code Gallery</span>
        </div>

        {/* Header and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-green/10 text-emerald-green border border-emerald-green/20">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-outfit text-2xl font-bold text-white">QR Code Gallery</h1>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">Browse, preview, and download custom QR codes for your short URLs.</p>
            </div>
          </div>

          <div className="relative rounded-lg shadow-sm w-full md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-neutral-500" />
            </div>
            <input
              type="text"
              placeholder="Search by code, alias, or target URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-lg border border-neutral-800 bg-[#0F0F0F] py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-emerald-green focus:outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        ) : filteredUrls.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-neutral-900 bg-[#0C0C0C]/30 text-neutral-500">
            <QrCode className="h-12 w-12 mx-auto text-neutral-800 mb-3" />
            <p className="text-sm font-medium">No matching QR Codes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredUrls.map((url) => (
              <motion.div
                key={url.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl border border-neutral-900 bg-[#0C0C0C] flex flex-col items-center justify-between hover:border-neutral-850 hover:bg-[#0E0E0E] transition-all relative group"
              >
                {/* QR Canvas Render */}
                <div className="mb-4">
                  <QRThumb url={url.shortUrl} />
                </div>

                <div className="w-full text-center truncate">
                  <p className="text-xs font-bold text-slate-200">/{url.shortCode}</p>
                  <p className="text-[10px] text-neutral-500 truncate mt-0.5" title={url.originalUrl}>
                    {url.originalUrl}
                  </p>
                </div>

                {/* Cover Overlay actions on hover */}
                <div className="flex items-center space-x-2 mt-4 w-full">
                  <button
                    onClick={() => openPreview(url.shortUrl, url.shortCode)}
                    className="flex-grow py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-[10px] font-bold text-neutral-300 hover:text-white flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => triggerDownload(url.shortUrl, url.shortCode)}
                    className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-green to-luxury-gold text-rich-black hover:opacity-90 transition-opacity cursor-pointer"
                    title="Download PNG"
                  >
                    <Download className="h-3 w-3 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      {/* QR Code Sharing and download modal */}
      <QRCodeModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        shortUrl={modalUrl}
        shortCode={modalCode}
      />

      <Footer />
    </div>
  );
};

export default QRGalleryPage;
