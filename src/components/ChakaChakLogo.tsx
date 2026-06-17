import React from 'react';
// @ts-ignore
import logoImg from '../assets/images/chakachak_logo_1781626982371.jpg';

interface ChakaChakLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  iconOnly?: boolean;
  showTagline?: boolean;
}

export default function ChakaChakLogo({
  className = '',
  size = 'md',
  iconOnly = false,
  showTagline = true,
}: ChakaChakLogoProps) {
  // Dimensions and scaling based on size
  let sizeClasses = 'w-32 h-32';

  if (size === 'sm') {
    sizeClasses = 'w-16 h-16';
  } else if (size === 'md') {
    sizeClasses = 'w-32 h-32';
  } else if (size === 'lg') {
    sizeClasses = 'w-48 h-48';
  } else if (size === 'xl') {
    sizeClasses = 'w-64 h-64';
  } else if (size === 'hero') {
    sizeClasses = 'w-80 h-80 sm:w-96 sm:h-96';
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} id="chakachak-logo-container">
      <img
        src={logoImg}
        alt="ChakaChak Car Wash Logo"
        referrerPolicy="no-referrer"
        className={`${sizeClasses} object-contain rounded-2xl select-none`}
      />
      {showTagline && !iconOnly && (
        <span className="text-[10px] sm:text-[11px] text-slate-500 font-extrabold uppercase tracking-[0.25em] font-mono mt-2 w-full text-center">
          Verified Vehicle Care
        </span>
      )}
    </div>
  );
}
