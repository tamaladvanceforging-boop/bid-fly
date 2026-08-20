"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  lightText?: boolean; // Set true for dark backgrounds
}

export function BidFlyLogo({ className, size = 'md', showText = true, subtitle, lightText }: LogoProps) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs rounded-lg',
    md: 'h-9 w-9 text-sm rounded-xl',
    lg: 'h-12 w-12 text-lg rounded-2xl',
    xl: 'h-16 w-16 text-2xl rounded-2xl'
  };

  const iconDimensions = {
    sm: 18,
    md: 22,
    lg: 30,
    xl: 40
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl'
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none shrink-0', className)}>
      {/* Bespoke Glowing Falcon / Wing Vector Emblem */}
      <div
        className={cn(
          'relative flex items-center justify-center font-black tracking-tight text-white shadow-xl overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105 border border-white/20',
          'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-blue-500/30',
          sizeClasses[size]
        )}
      >
        {/* Abstract Falcon Wing / Bid Arrow SVG */}
        <svg
          width={iconDimensions[size]}
          height={iconDimensions[size]}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          {/* Stylized Dynamic Ascending Wings */}
          <path
            d="M3 17.5L12 4L21 17.5L12 13.5L3 17.5Z"
            fill="url(#wingGradient)"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M12 4V13.5"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7 15L12 9L17 15"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.9"
          />
          <defs>
            <linearGradient id="wingGradient" x1="12" y1="4" x2="12" y2="17.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="1" />
              <stop offset="1" stopColor="#93c5fd" stopOpacity="0.75" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ambient Gloss */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20 pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            {/* Crystal Clear "Bid" and Vibrant "Fly" */}
            <span className={cn("font-black tracking-tight flex items-center leading-none", textSizes[size])}>
              <span className={cn(
                "font-black drop-shadow-sm transition-colors",
                lightText ? "text-white" : "text-foreground dark:text-white"
              )}>
                Bid
              </span>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent ml-[1.5px] font-black">
                Fly
              </span>
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 border border-cyan-500/30 leading-none shadow-xs">
              PRO
            </span>
          </div>
          <p className={cn(
            "text-[10px] font-semibold mt-1 truncate leading-tight tracking-tight",
            lightText ? "text-slate-400" : "text-muted-foreground"
          )}>
            {subtitle || 'Enterprise Bid & Tender Suite'}
          </p>
        </div>
      )}
    </div>
  );
}
