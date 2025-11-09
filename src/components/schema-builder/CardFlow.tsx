"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FlowCard {
  id: string;
  label: string;
  icon?: string;
  isActive: boolean;
  onClick: () => void;
  onAdd?: () => void; // Called when the "+" node before this card is clicked
  content?: React.ReactNode; // Custom content to show when active
}

interface CardFlowProps {
  cards: FlowCard[];
  accentColor?: string;
  className?: string;
}

export function CardFlow({ cards, accentColor = "#3B82F6", className }: CardFlowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {cards.map((card, index) => (
        <div key={card.id} className="flex items-center gap-2">
          {/* Card */}
          <FlowCardComponent
            card={card}
            accentColor={accentColor}
            isFirst={index === 0}
          />

          {/* Connection Line + Add Node (if not last) */}
          {index < cards.length - 1 && (
            <ConnectionNode
              onAdd={card.onAdd}
              isActive={card.isActive}
              accentColor={accentColor}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface FlowCardComponentProps {
  card: FlowCard;
  accentColor: string;
}

function FlowCardComponent({ card, accentColor }: FlowCardComponentProps) {
  return (
    <motion.button
      onClick={card.onClick}
      className={cn(
        "relative px-4 py-2.5 rounded-lg transition-all duration-200",
        "flex items-center gap-2 min-w-[120px]",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]",
        card.isActive
          ? "bg-[#1f1f1f] border-2"
          : "bg-transparent border-2 border-[#2a2a2a] hover:border-[#3a3a3a]"
      )}
      style={{
        borderColor: card.isActive ? accentColor : undefined,
        "--focus-ring-color": accentColor,
      } as React.CSSProperties & { "--focus-ring-color": string }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Accent indicator line on left */}
      {card.isActive && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: accentColor }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Icon */}
      {card.icon && (
        <span
          className={cn(
            "text-base",
            card.isActive ? "opacity-100" : "opacity-50"
          )}
        >
          {card.icon}
        </span>
      )}

      {/* Label */}
      <span
        className={cn(
          "text-xs font-medium flex-1 text-left",
          card.isActive ? "text-[#ededed]" : "text-[#a0a0a0]"
        )}
      >
        {card.label}
      </span>

      {/* Active indicator dot */}
      {card.isActive && (
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accentColor }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Custom content overlay when active */}
      {card.isActive && card.content && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/95 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {card.content}
        </motion.div>
      )}
    </motion.button>
  );
}

interface ConnectionNodeProps {
  onAdd?: () => void;
  isActive: boolean;
  accentColor: string;
}

function ConnectionNode({ onAdd, isActive, accentColor }: ConnectionNodeProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Connection line */}
      <div
        className={cn(
          "h-0.5 transition-colors duration-200",
          isActive ? "bg-[#3a3a3a]" : "bg-[#2a2a2a]"
        )}
        style={{ width: "24px" }}
      />

      {/* Add node */}
      {onAdd && (
        <motion.button
          onClick={onAdd}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            "border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]",
            isActive
              ? "border-blue-600 bg-blue-600/20 hover:bg-blue-600/30"
              : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
          )}
          style={{
            "--focus-ring-color": accentColor,
          } as React.CSSProperties & { "--focus-ring-color": string }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            className={cn(
              "text-xs font-medium",
              isActive ? "text-blue-400" : "text-[#666666]"
            )}
            animate={{ rotate: isActive ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            +
          </motion.span>
        </motion.button>
      )}

      {/* Connection line after */}
      <div
        className={cn(
          "h-0.5 transition-colors duration-200",
          isActive ? "bg-[#3a3a3a]" : "bg-[#2a2a2a]"
        )}
        style={{ width: "24px" }}
      />
    </div>
  );
}

