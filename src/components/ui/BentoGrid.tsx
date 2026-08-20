"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[16rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  badge,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-2xl group/bento hover:shadow-2xl transition duration-300 shadow-input dark:shadow-none p-5 dark:bg-[#0f172a]/80 bg-card border border-white/[0.08] justify-between flex flex-col space-y-4 backdrop-blur-xl hover:border-primary/50 relative overflow-hidden",
        className
      )}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 opacity-0 group-hover/bento:opacity-100 transition duration-500 pointer-events-none" />

      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-200 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover/bento:bg-primary group-hover/bento:text-primary-foreground transition-all duration-300">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              {badge}
            </span>
          )}
        </div>
        <div className="font-bold text-foreground mb-1 text-sm tracking-tight">
          {title}
        </div>
        <div className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
          {description}
        </div>
      </div>
    </div>
  );
};
