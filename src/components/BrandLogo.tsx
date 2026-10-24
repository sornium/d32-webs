import React from 'react';

interface BrandLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function BrandLogoIcon({ size = 32, className = '' }: { size?: number | string; className?: string }) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shadow-lg border border-white/20 bg-white/10 backdrop-blur-xl shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="neutralBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <radialGradient id="topWhiteShine" cx="20%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background dark glass */}
        <rect width="100" height="100" rx="22" fill="url(#neutralBrandGrad)" />
        {/* Soft specular sheen */}
        <rect width="100" height="100" rx="22" fill="url(#topWhiteShine)" />

        {/* Stylized Modern "D" Symbol in pure white */}
        <path
          d="M 31 28.5 
             H 54 
             C 69 28.5 76 36 76 50 
             C 76 64 69 71.5 54 71.5 
             H 31 
             V 52 
             C 36 52 42.5 49 42.5 44 
             C 42.5 39 36 36 31 36 
             Z
             M 43 39.5
             V 60.5
             H 54
             C 63 60.5 67 56 67 50
             C 67 44 63 39.5 54 39.5
             Z"
          fill="#ffffff"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default function BrandLogo({ size = 32, className = '', showText = true, textClassName = '' }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandLogoIcon size={size} />
      {showText && (
        <span className={`text-lg font-bold tracking-tight text-white ${textClassName}`}>
          d32<span className="text-white/70 font-medium">.store</span>
        </span>
      )}
    </div>
  );
}
