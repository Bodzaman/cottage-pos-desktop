import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { colors } from "../utils/InternalDesignSystem";

interface AdminAppTileProps {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
  badge?: number | boolean;
  onOpen: (id: string) => void;
  index: number;
}

export function AdminAppTile({ id, icon: Icon, label, color, badge, onOpen, index }: AdminAppTileProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={() => onOpen(id)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.35,
        delay: prefersReducedMotion ? 0 : index * 0.06,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      whileHover={prefersReducedMotion ? { opacity: 0.85 } : "hover"}
      whileTap={prefersReducedMotion
        ? { opacity: 0.7 }
        : { scale: 0.96, transition: { type: "spring", stiffness: 400, damping: 25 } }
      }
      className="group relative flex flex-col items-center gap-3 p-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] rounded-[24px]"
      aria-label={`Open ${label}`}
    >
      {/* Per-tile halo */}
      <div
        className="absolute pointer-events-none rounded-[24px] transition-opacity duration-300 opacity-70 group-hover:opacity-100"
        style={{
          width: '104px',
          height: '104px',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%) scale(1.4)',
          background: `radial-gradient(circle at center, ${color}20 0%, ${color}10 40%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Icon square */}
      <motion.div
        className="relative flex items-center justify-center w-[104px] h-[104px] rounded-[24px] overflow-hidden"
        style={{
          background: `linear-gradient(165deg, ${color}F0 0%, ${color}CC 55%, ${color}AA 100%)`,
          boxShadow: `0 2px 8px ${color}20`,
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
        variants={prefersReducedMotion ? undefined : {
          hover: {
            scale: 1.05,
            boxShadow: `0 4px 16px ${color}30, 0 2px 8px ${color}40`,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          },
        }}
      >
        {/* Top specular highlight — light from above */}
        <div
          className="absolute inset-x-0 top-0 h-[40%] pointer-events-none rounded-t-[24px]"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
          }}
        />

        {/* Sparkle glint — small specular point */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '20px',
            height: '20px',
            top: '10px',
            right: '14px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 60%)',
            borderRadius: '50%',
          }}
        />

        <Icon className="w-10 h-10 text-white relative z-10" />

        {/* Shimmer sweep */}
        {!prefersReducedMotion && (
          <div
            className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              animation: 'admin-tile-shimmer 2s infinite',
            }}
          />
        )}

        {/* Badge */}
        {badge !== undefined && badge !== false && badge !== 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white px-1 z-20"
            style={{ backgroundColor: "#EF4444" }}
          >
            {typeof badge === "number" ? (badge > 99 ? "99+" : badge) : ""}
          </span>
        )}
      </motion.div>

      {/* Label */}
      <span
        className="text-xs font-medium truncate max-w-[110px] text-center"
        style={{ color: colors.text.secondary }}
      >
        {label}
      </span>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes admin-tile-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.button>
  );
}
