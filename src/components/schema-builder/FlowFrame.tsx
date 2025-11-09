"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FlowFrameProps {
  label: string;
  icon?: string;
  isActive: boolean;
  accentColor: string;
  position: { x: number; y: number };
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
}

export function FlowFrame({
  label,
  icon,
  isActive,
  accentColor,
  position,
  onClose,
  children,
  className,
  width = 300,
  height = 220,
}: FlowFrameProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "absolute bg-[#1a1a1a] rounded-lg border-2 shadow-2xl",
        "pointer-events-auto",
        "min-w-[280px] z-40",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        borderColor: accentColor,
        width: `${width}px`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-sm font-medium text-[#ededed]">{label}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center",
              "text-[#a0a0a0] hover:text-[#ededed] hover:bg-[#2a2a2a]",
              "transition-colors"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11 3L3 11M3 3l8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Accent line */}
      <div
        className="h-1"
        style={{ backgroundColor: accentColor }}
      />

      {/* Content */}
      <div className="p-4" style={{ minHeight: `${height - 80}px` }}>{children}</div>
    </motion.div>
  );
}

