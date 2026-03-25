import React from "react";

export default function GlassCard({ children, className = "", glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-xl p-5 transition-all duration-300 glass-hover ${glow ? "neon-magenta" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}