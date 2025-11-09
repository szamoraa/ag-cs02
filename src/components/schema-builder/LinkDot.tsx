"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LinkDotProps {
  position: { x: number; y: number };
  isLinked: boolean;
  onLink: () => void;
  onUnlink?: () => void;
  onHover?: (hovered: boolean) => void;
  accentColor?: string;
}

export function LinkDot({
  position,
  isLinked,
  onLink,
  onUnlink,
  onHover,
  accentColor = "#3B82F6",
}: LinkDotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLinked && onUnlink) {
      setShowContextMenu(true);
    } else {
      onLink();
    }
  };

  const handleRemoveLink = () => {
    if (onUnlink) {
      onUnlink();
      setShowContextMenu(false);
    }
  };

  return (
    <>
      {/* Link dot */}
      <motion.button
        className={cn(
          "absolute w-8 h-8 rounded-full flex items-center justify-center",
          "border-2 transition-all duration-200 z-20",
          "cursor-pointer focus:outline-none",
          isLinked ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#1a1a1a] border-[#2a2a2a]"
        )}
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          pointerEvents: "auto",
        }}
        onClick={handleClick}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover?.(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover?.(false);
        }}
        whileHover={{
          borderColor: accentColor,
          boxShadow: `0 0 4px ${accentColor}40`,
        }}
        aria-label={isLinked ? "Manage link" : "Link cards"}
        title={isLinked ? "Manage link" : "Link cards"}
      >
        <motion.span
          className={cn(
            "text-xs font-medium select-none",
            isLinked ? "text-[#a0a0a0]" : "text-[#666666]"
          )}
        >
          {isLinked ? "●" : "○"}
        </motion.span>
      </motion.button>

      {/* Context menu for removing link */}
      {showContextMenu && isLinked && (
        <motion.div
          className="absolute z-[60] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[6px] shadow-lg min-w-[120px]"
          style={{
            left: position.x + 20,
            top: position.y,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onMouseLeave={() => setShowContextMenu(false)}
        >
          <button
            onClick={handleRemoveLink}
            className="w-full px-3 py-2 text-left text-[11px] font-abc-regular text-[#a0a0a0] hover:text-[#ededed] hover:bg-[#1f1f1f] transition-colors rounded-[6px]"
          >
            Remove link
          </button>
        </motion.div>
      )}
    </>
  );
}

