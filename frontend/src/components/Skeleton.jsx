import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-800/40 border border-neutral-700/20 ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
