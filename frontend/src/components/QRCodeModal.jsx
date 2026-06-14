import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Share2, Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

const QRCodeModal = ({ isOpen, onClose, shortUrl, shortCode }) => {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && shortUrl) {
      // Draw QR Code to canvas with styling matching our dark theme
      QRCode.toCanvas(
        canvasRef.current,
        shortUrl,
        {
          width: 220,
          margin: 1.5,
          color: {
            dark: '#0A0A0A', // Rich black for QR elements
            light: '#FBBF24' // Gold background for luxury theme!
          }
        },
        (error) => {
          if (error) console.error('Error generating QR code', error);
        }
      );
    }
  }, [isOpen, shortUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `nexlink-qr-${shortCode}.png`;
    link.href = url;
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      if (navigator.share) {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `nexlink-qr-${shortCode}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: `NexLink QR Code for ${shortCode}`,
                text: `Scan this QR to visit NexLink: ${shortUrl}`,
              });
            } catch (err) {
              if (err.name !== 'AbortError') {
                await navigator.share({
                  title: `NexLink for ${shortCode}`,
                  text: `Scan this QR to visit NexLink: ${shortUrl}`,
                  url: shortUrl
                });
              }
            }
          } else {
            await navigator.share({
              title: `NexLink for ${shortCode}`,
              text: `Visit NexLink: ${shortUrl}`,
              url: shortUrl
            });
          }
        });
      } else {
        handleCopyLink();
      }
    } catch (err) {
      console.error('Sharing failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-rich-black/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-sm rounded-xl border border-neutral-800 bg-[#121212] p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-outfit text-lg font-bold text-white">Share QR Code</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="flex flex-col items-center justify-center bg-[#070707] border border-neutral-900 rounded-lg p-5 mb-5 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-green/5 to-luxury-gold/5 rounded-lg pointer-events-none" />
          <div className="relative rounded-lg p-1.5 bg-gradient-to-r from-emerald-green via-neutral-800 to-luxury-gold shadow-[0_0_15px_rgba(251,191,36,0.15)]">
            <canvas ref={canvasRef} className="rounded" />
          </div>
          <span className="text-[10px] text-neutral-500 mt-3 font-medium tracking-wide">
            Scan to visit NexLink
          </span>
        </div>

        {/* Shortened URL display */}
        <div className="bg-[#0F0F0F] rounded-lg border border-neutral-900 px-3 py-2 text-xs text-neutral-400 font-mono text-center mb-5 truncate select-all">
          {shortUrl}
        </div>

        {/* Actions Button Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg text-xs font-bold text-rich-black bg-gradient-to-r from-emerald-green to-luxury-gold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PNG</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
              copied 
                ? 'bg-emerald-green/20 border-emerald-green/30 text-emerald-green' 
                : 'bg-neutral-800 border-neutral-700/50 text-slate-300 hover:bg-neutral-700'
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

          {/* Share QR */}
          <button
            onClick={handleShare}
            className="col-span-2 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold border border-neutral-800 bg-[#161616] text-slate-300 hover:text-white hover:bg-neutral-800/80 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-luxury-gold" />
            <span>Share QR Code</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default QRCodeModal;
