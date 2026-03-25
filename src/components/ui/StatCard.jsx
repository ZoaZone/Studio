import React from "react";

export default function StatCard({ label, value, icon: Icon, trend, color = "magenta" }) {
  const colorMap = {
    magenta: "text-magenta bg-magenta/10 border-magenta/20 shadow-magenta/10",
    gold: "text-gold bg-gold/10 border-gold/20 shadow-gold/10",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-blue-400/10",
    green: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-emerald-400/10",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20 shadow-purple-400/10",
  };

  const parts = (colorMap[color] || colorMap.magenta).split(" ");

  return (
    <div className={`glass rounded-xl p-5 border ${parts[2]} shadow-lg ${parts[3]} transition-all duration-300 glass-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend > 0 ? "+" : ""}{trend}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${parts[1]} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${parts[0]}`} />
          </div>
        )}
      </div>
    </div>
  );
}