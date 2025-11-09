"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Schema } from "@/types/schema";
import { cn } from "@/lib/utils";

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: Schema;
}

export function JsonModal({ isOpen, onClose, schema }: JsonModalProps) {
  const jsonString = JSON.stringify(schema, null, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
                <h2 className="text-lg font-medium text-[#ededed]">Schema JSON Preview</h2>
                <button
                  onClick={onClose}
                  className={cn(
                    "w-8 h-8 rounded-lg",
                    "flex items-center justify-center",
                    "text-[#a0a0a0] hover:text-[#ededed]",
                    "hover:bg-[#2a2a2a]",
                    "transition-colors"
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M12 4L4 12M4 4l8 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                <pre className="text-xs text-[#a0a0a0] font-mono leading-relaxed">
                  {jsonString}
                </pre>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#2a2a2a] flex justify-end">
                <button
                  onClick={onClose}
                  className={cn(
                    "px-4 py-2 rounded-lg",
                    "bg-[#2a2a2a] hover:bg-[#3a3a3a]",
                    "text-[#ededed] text-sm font-medium",
                    "transition-colors"
                  )}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

