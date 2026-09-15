import React from "react";

const EmsLogo = ({ size = 40, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="EMS logo"
  >
    <defs>
      <linearGradient id="emsLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="55%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="emsLogoShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.28" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="emsE" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e0e7ff" />
      </linearGradient>
      <linearGradient id="emsChevron" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#c7d2fe" />
      </linearGradient>
    </defs>

    {/* Rounded gradient background */}
    <rect width="64" height="64" rx="14" fill="url(#emsLogoBg)" />

    {/* Top-half glossy shine */}
    <rect width="64" height="34" rx="14" fill="url(#emsLogoShine)" />

    {/* Subtle inner stroke */}
    <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="white" strokeOpacity="0.14" />

    {/* Bold "E" — vertical stem */}
    <rect x="14" y="14" width="9" height="36" rx="1.5" fill="url(#emsE)" />

    {/* Top bar */}
    <rect x="14" y="14" width="30" height="9" rx="1.5" fill="url(#emsE)" />

    {/* Middle bar with chevron/arrow cut on right end (dynamic forward motion) */}
    <path
      d="M14 27.5 L38 27.5 L44 32 L38 36.5 L14 36.5 Z"
      fill="url(#emsChevron)"
    />

    {/* Bottom bar */}
    <rect x="14" y="41" width="30" height="9" rx="1.5" fill="url(#emsE)" />
  </svg>
);

export default EmsLogo;
