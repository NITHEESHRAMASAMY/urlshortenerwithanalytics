import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const TiltCard = ({ children, className = '', glowColor = 'rgba(16, 185, 129, 0.12)' }) => {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for tilt position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for perspective tilt
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    // Relative mouse position from -0.5 to +0.5
    x.set((mouseX / width) - 0.5);
    y.set((mouseY / height) - 0.5);

    // Save absolute coordinates relative to the card for the spotlight effect
    setCoords({ x: mouseX, y: mouseY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative rounded-xl p-[1.5px] overflow-hidden bg-gradient-to-br from-emerald-green/20 via-neutral-800 to-luxury-gold/20 transition-all duration-300 ${
        isHovered ? 'shadow-[0_0_30px_rgba(251,191,36,0.08)] border-neutral-700/50' : 'shadow-2xl border-transparent'
      } ${className}`}
    >
      {/* Spotlight Hover Effect */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 70%)`,
            zIndex: 1,
          }}
        />
      )}

      {/* Content wrapper: Solid Dark Card with Layered Depth */}
      <div className="relative z-10 w-full h-full rounded-[10px] bg-[#121212] p-6 text-slate-200">
        {children}
      </div>
    </motion.div>
  );
};

export default TiltCard;
