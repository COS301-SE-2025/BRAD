import React from "react";

export default function StatCard({ title, value, color, icon }) {
  return (
    <div className="card p-6 text-center flex flex-col items-center justify-center space-y-2 min-w-[150px]">
      {icon &&
        (typeof icon === "string" ? (
          <img src={icon} alt={title} className="w-8 h-8 object-contain" />
        ) : (
          React.createElement(icon, { className: "w-8 h-8 text-gray-500" })
        ))}
      <h3 className="text-sm font-medium text-gray-500 truncate w-full">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
