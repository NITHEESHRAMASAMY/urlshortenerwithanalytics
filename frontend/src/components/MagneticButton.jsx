import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MagneticButton = ({ children, className = '', onClick, type = 'button', disabled = false, ...props }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (disabled || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Calculate distance from center of the button
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);

    // Limit maximum displacement to 12px
    const maxDisplacement = 12;
    const pullX = (x / (width / 2)) * maxDisplacement;
    const pullY = (y / (height / 2)) * maxDisplacement;

    setPosition({ x: pullX, y: pullY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={position}
      transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 0.1 }}
      className="inline-block"
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`relative overflow-hidden group select-none transition-all active:scale-95 ${className}`}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        {/* Glow effect on hover */}
        {!disabled && (
          <span className="absolute inset-0 w-full h-full bg-white/10 scale-0 rounded-full group-hover:scale-125 transition-transform duration-500 ease-out origin-center pointer-events-none" />
        )}
      </button>
    </motion.div>
  );
};

export default MagneticButton;
