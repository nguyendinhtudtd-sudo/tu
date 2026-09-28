import React, { useState } from 'react';

interface ProgressBarProps {
  progress: number;
  onChange?: (newProgress: number) => void;
  interactive?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  onChange,
  interactive = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const clampedProgress = Math.max(0, Math.min(100, progress || 0));

  const getColor = (p: number) => {
    if (p >= 100) return 'bg-emerald-600';
    if (p >= 70) return 'bg-blue-600';
    if (p >= 30) return 'bg-sky-600';
    if (p > 0) return 'bg-amber-500';
    return 'bg-slate-300';
  };

  const getTextColor = (p: number) => {
    if (p >= 100) return 'text-emerald-700 font-semibold';
    if (p > 0) return 'text-blue-700 font-semibold';
    return 'text-slate-500';
  };

  if (!interactive || !onChange) {
    return (
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${getColor(clampedProgress)}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
        <span className={`text-xs font-mono tabular-nums ${getTextColor(clampedProgress)}`}>
          {clampedProgress}%
        </span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        onClick={() => setIsEditing(!isEditing)}
        className="flex items-center gap-2 cursor-pointer py-1 px-1.5 -mx-1.5 rounded hover:bg-slate-100/70 transition-colors"
        title="Nhấp để điều chỉnh tiến độ"
      >
        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${getColor(clampedProgress)}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
        <span className={`text-xs font-mono tabular-nums min-w-[32px] text-right ${getTextColor(clampedProgress)}`}>
          {clampedProgress}%
        </span>
      </div>

      {isEditing && (
        <div className="absolute z-20 left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 w-52 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700">Cập nhật tiến độ:</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums">{clampedProgress}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={clampedProgress}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2.5"
          />

          <div className="grid grid-cols-5 gap-1 mb-2">
            {[0, 25, 50, 75, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  onChange(val);
                }}
                className={`py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                  clampedProgress === val
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-2 py-0.5 rounded cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
