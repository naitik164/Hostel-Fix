import React, { useState } from 'react';
import { User } from 'lucide-react';

const UserAvatar = ({ src, name = 'Student', size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const getInitial = (str) => {
    if (!str || typeof str !== 'string') return 'S';
    return str.trim().charAt(0).toUpperCase();
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border-2 border-sky ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-action text-white font-bold flex items-center justify-center border-2 border-sky shadow-sm uppercase ${className}`}
    >
      {getInitial(name)}
    </div>
  );
};

export default UserAvatar;
