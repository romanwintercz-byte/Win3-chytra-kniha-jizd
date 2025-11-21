import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  colorClass?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, colorClass = "bg-white" }) => {
  return (
    <div className={`${colorClass} p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between transition-all hover:shadow-md`}>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
      </div>
      <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
        {icon}
      </div>
    </div>
  );
};