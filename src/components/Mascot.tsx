"use client";

import { motion } from "framer-motion";

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
      <svg
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        {/* Ombre */}
        <ellipse cx="50" cy="106" rx="20" ry="4" fill="#FDE68A" opacity="0.5" />

        {/* Corps du canard — jaune doré */}
        <ellipse cx="50" cy="68" rx="28" ry="30" fill="#FCD34D" />

        {/* Ventre plus clair */}
        <ellipse cx="50" cy="76" rx="17" ry="18" fill="#FEF3C7" />

        {/* Queue */}
        <ellipse cx="76" cy="72" rx="9" ry="6" fill="#F59E0B" transform="rotate(-20 76 72)" />

        {/* Aile gauche */}
        <ellipse cx="24" cy="68" rx="9" ry="6" fill="#F59E0B" transform="rotate(20 24 68)" />

        {/* Tête */}
        <circle cx="50" cy="40" r="22" fill="#FCD34D" />

        {/* Casquette bleue (style Picsou) */}
        <ellipse cx="50" cy="22" rx="20" ry="5" fill="#1D4ED8" />
        <rect x="30" y="10" width="40" height="14" rx="6" fill="#2563EB" />
        {/* Visière */}
        <ellipse cx="50" cy="22" rx="22" ry="4" fill="#1E40AF" />
        <ellipse cx="50" cy="22" rx="20" ry="3" fill="#3B82F6" />
        {/* Bouton du haut */}
        <circle cx="50" cy="10" r="3" fill="#1D4ED8" />

        {/* Yeux blancs */}
        <circle cx="40" cy="40" r="9" fill="white" />
        <circle cx="60" cy="40" r="9" fill="white" />

        {/* Pupilles */}
        <motion.g
          animate={mood === "thinking" ? { x: 1.5 } : { x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <circle cx="42" cy="41" r="5" fill="#1C1917" />
          <circle cx="62" cy="41" r="5" fill="#1C1917" />
          {/* Reflets brillants */}
          <circle cx="44" cy="39" r="1.8" fill="white" />
          <circle cx="64" cy="39" r="1.8" fill="white" />
        </motion.g>

        {/* Clignement */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.05, 1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.42, 0.47, 0.52, 1] }}
        >
          <ellipse cx="40" cy="40" r="9" fill="#FCD34D" style={{ transformOrigin: "40px 40px" }}
          />
          <ellipse cx="60" cy="40" r="9" fill="#FCD34D" style={{ transformOrigin: "60px 40px" }}
          />
        </motion.g>

        {/* Bec orange — en forme de canard */}
        <path d="M 43 52 Q 50 60 57 52 Q 53 56 50 57 Q 47 56 43 52 Z" fill="#F97316" />
        <path d="M 43 52 Q 50 48 57 52" stroke="#EA580C" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Joues roses */}
        <circle cx="33" cy="46" r="5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="67" cy="46" r="5" fill="#FCA5A5" opacity="0.6" />

        {/* Patte gauche avec crayon */}
        <rect x="34" y="95" width="6" height="12" rx="3" fill="#F97316" />
        <rect x="42" y="95" width="6" height="12" rx="3" fill="#F97316" />

        {/* Crayon tenu */}
        <g transform="rotate(25, 75, 72)">
          <rect x="72" y="56" width="5" height="22" rx="1.5" fill="#FDE68A" stroke="#F59E0B" strokeWidth="0.5" />
          <polygon points="72,56 77,56 74.5,49" fill="#F97316" />
          <rect x="72" y="76" width="5" height="3" rx="1" fill="#9CA3AF" />
          <rect x="72" y="78" width="5" height="2" rx="1" fill="#EF4444" />
        </g>

        {/* Étoiles si celebrate */}
        {mood === "celebrate" && (
          <>
            <motion.text
              x="5" y="30" fontSize="12"
              animate={{ rotate: [0, 20, -20, 0], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ transformOrigin: "11px 24px" }}
            >⭐</motion.text>
            <motion.text
              x="78" y="20" fontSize="10"
              animate={{ rotate: [0, -15, 15, 0], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              style={{ transformOrigin: "83px 15px" }}
            >✨</motion.text>
          </>
        )}

        {/* Bulle pensée si thinking */}
        {mood === "thinking" && (
          <g>
            <circle cx="72" cy="20" r="7" fill="white" stroke="#E5E7EB" strokeWidth="1" />
            <text x="69" y="24" fontSize="9">💭</text>
          </g>
        )}
      </svg>
    </motion.div>
  );
}
