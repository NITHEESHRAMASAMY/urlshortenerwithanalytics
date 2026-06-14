import React from 'react';
import { Link2 } from 'lucide-react';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="border-t border-neutral-900 bg-[#070707] py-12 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo and Tagline */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-emerald-green to-luxury-gold p-[0.5px]">
                <div className="flex h-full w-full items-center justify-center rounded bg-[#0A0A0A] overflow-hidden">
                  <img src={logo} alt="NexLink Logo" className="h-full w-full object-cover" />
                </div>
              </div>
              <span className="font-outfit text-lg font-bold tracking-tight text-white">
                Nex<span className="text-luxury-gold">Link</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium max-w-xs text-center md:text-left">
              Transform Every Click Into Intelligence! Generate secure short links and unlock insights.
            </p>
          </div>

          {/* Links & Details */}
          <div className="flex flex-col items-center md:items-end space-y-2 text-xs text-neutral-600">
            <div>
              &copy; {new Date().getFullYear()} NexLink. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <span className="hover:text-neutral-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span>&bull;</span>
              <span className="hover:text-neutral-400 cursor-pointer transition-colors">Terms of Service</span>
              <span>&bull;</span>
              <span className="hover:text-neutral-400 cursor-pointer transition-colors">Developer API</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
