"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Example component demonstrating Framer Motion animations
 */
export function AnimatedExample() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "bg-gradient-to-r from-blue-500 to-purple-600",
          "text-white rounded-lg p-8 shadow-lg",
          "text-center max-w-md"
        )}
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-bold mb-4"
        >
          Framer Motion
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg"
        >
          Animation library is ready to use!
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "mt-6 px-6 py-3 bg-white text-purple-600",
            "rounded-lg font-semibold shadow-md",
            "transition-colors"
          )}
        >
          Hover me!
        </motion.button>
      </motion.div>
    </div>
  );
}

