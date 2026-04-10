"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface MascotProps {
  size?: number;
  mood?: "happy" | "excited" | "thinking" | "celebrate";
  className?: string;
}

export function Mascot({ size = 120, mood = "happy", className = "" }: MascotProps) {
  return (
    <motion.div
      className={className}
      animate={
        mood === "celebrate"
          ? { rotate: [0, -12, 12, -8, 8, 0], y: [0, -10, 0] }
          : mood === "excited"
          ? { y: [0, -8, 0] }
          : { y: [0, -5, 0] }
      }
      transition={
        mood === "celebrate"
          ? { duration: 0.7, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }
          : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
      }
      style={{ width: size, height: size, display: "inline-block" }}
    >
      <Image
        src="/mascot.png"
        alt="Dictou"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: 12 }}
        priority
      />
    </motion.div>
  );
}
