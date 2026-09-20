import React from "react";

interface BhoomiEmblemProps {
  className?: string;
  size?: number;
}

export function BhoomiEmblem({ className = "w-9 h-9", size }: BhoomiEmblemProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="emblemGoldGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="emblemDarkBase" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B132B" />
            <stop offset="1" stopColor="#1C2541" />
          </linearGradient>
          <linearGradient id="saffronGrad" x1="10" y1="8" x2="34" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF9933" />
            <stop offset="1" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="emeraldGrad" x1="10" y1="18" x2="34" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="azureGrad" x1="10" y1="26" x2="34" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>

        {/* Outer Circular Ring with Metallic Border */}
        <circle cx="22" cy="22" r="21" fill="url(#emblemDarkBase)" stroke="url(#emblemGoldGrad)" strokeWidth="1.5" />
        <circle cx="22" cy="22" r="18.5" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />

        {/* Cadastral Land Parcel Isometric Polygon Tier 1: Infrastructure / Land (Saffron) */}
        <path
          d="M22 8L35 15L22 21.5L9 15L22 8Z"
          fill="url(#saffronGrad)"
          stroke="#FFE082"
          strokeWidth="0.75"
        />

        {/* Tier 2: Environmental Green / Possession (Emerald) */}
        <path
          d="M9 19.5L22 26L35 19.5V23L22 29.5L9 23V19.5Z"
          fill="url(#emeraldGrad)"
          stroke="#A7F3D0"
          strokeWidth="0.75"
        />

        {/* Tier 3: Civic Foundation / DBT Settlement (Azure) */}
        <path
          d="M9 27L22 33.5L35 27V30.5L22 37L9 30.5V27Z"
          fill="url(#azureGrad)"
          stroke="#93C5FD"
          strokeWidth="0.75"
        />

        {/* Center Ashoka Wheel Hub Motif */}
        <circle cx="22" cy="14.8" r="3.2" fill="#0A192F" stroke="#FBBF24" strokeWidth="1" />
        <circle cx="22" cy="14.8" r="1.3" fill="#FBBF24" />
      </svg>
    </div>
  );
}
