"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FlowNodeLabel = "schedule" | "threshold" | "notify";

interface FlowNodeProps {
  isActive: boolean;
  accentColor: string;
  onClick: () => void;
  position?: { x: number; y: number };
  label?: FlowNodeLabel;
  isMenuOpen?: boolean;
  className?: string;
}

export function FlowNode({
  isActive,
  accentColor,
  onClick,
  position,
  label,
  isMenuOpen = false,
  className,
}: FlowNodeProps) {
  const highlight = isActive || isMenuOpen;
  const backgroundColor = highlight ? accentColor : "#1a1a1a";
  const borderColor = highlight ? accentColor : "#2a2a2a";
  const isAbsolute = Boolean(position);

  return (
    <motion.button
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        isAbsolute ? "absolute" : "relative",
        "w-8 h-8 rounded-full flex items-center justify-center",
        "border-2 transition-all duration-200 z-50",
        "cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
      , className)}
      style={{
        ...(isAbsolute
          ? {
              left: position?.x,
              top: position?.y,
              transform: "translate(-50%, -50%)",
            }
          : {}),
        pointerEvents: "auto",
        backgroundColor,
        borderColor,
      }}
      aria-label={label ? `Add ${label} stage` : "Add stage"}
      whileHover={{
        borderColor: accentColor,
        boxShadow: "0 0 4px rgba(167, 139, 250, 0.18)",
      }}
    >
      <motion.span
        className={cn(
          "text-sm font-medium select-none leading-none",
          highlight ? "text-white" : "text-[#a0a0a0]"
        )}
        animate={{ 
          rotate: isMenuOpen ? 45 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        +
      </motion.span>
    </motion.button>
  );
}

