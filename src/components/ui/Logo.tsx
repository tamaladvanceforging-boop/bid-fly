import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  subtitle?: string
}

export function BidFlyLogo({ className, size = 'md', showText = true, subtitle }: LogoProps) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-2xl'
  }

  const iconDimensions = {
    sm: 18,
    md: 22,
    lg: 30,
    xl: 40
  }

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {/* Bespoke Glowing Falcon / Wing Vector Emblem */}
      <div
        className={cn(
          'relative rounded-xl flex items-center justify-center font-black tracking-tight text-white shadow-lg overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105',
          'bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-400 shadow-blue-500/25',
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
          className="drop-shadow-sm"
        >
          {/* Stylized Dynamic Ascending Wings */}
          <path
            d="M3 17.5L12 4L21 17.5L12 13.5L3 17.5Z"
            fill="url(#wingGradient)"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 4V13.5"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M7 15L12 9L17 15"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <defs>
            <linearGradient id="wingGradient" x1="12" y1="4" x2="12" y2="17.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#93c5fd" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-foreground text-base sm:text-lg">
              Bid<span className="text-primary bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Fly</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 leading-none">
              PRO
            </span>
          </div>
          <p className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate leading-tight">
            {subtitle || 'Enterprise Bid & Tender Suite'}
          </p>
        </div>
      )}
    </div>
  )
}
