import React from 'react';
import { TaskStatus } from '../types/task';
import { CheckCircle2, Clock, AlertCircle, PlayCircle, PauseCircle, ChevronDown } from 'lucide-react';

interface StatusIndicatorProps {
  status: TaskStatus;
  onChange?: (newStatus: TaskStatus) => void;
  interactive?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  onChange,
  interactive = true,
}) => {
  const getStatusConfig = (s: TaskStatus) => {
    switch (s) {
      case 'Hoàn thành':
        return {
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50/80 hover:bg-emerald-100/80',
          borderColor: 'border-emerald-200',
          dotColor: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        };
      case 'Đang thực hiện':
        return {
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50/80 hover:bg-blue-100/80',
          borderColor: 'border-blue-200',
          dotColor: 'bg-blue-500',
          icon: <PlayCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
        };
      case 'Chậm tiến độ':
        return {
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50/80 hover:bg-rose-100/80',
          borderColor: 'border-rose-200',
          dotColor: 'bg-rose-500',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
        };
      case 'Tạm hoãn':
        return {
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50/80 hover:bg-amber-100/80',
          borderColor: 'border-amber-200',
          dotColor: 'bg-amber-500',
          icon: <PauseCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
        };
      case 'Chưa thực hiện':
      case 'Chưa cập nhật':
      default:
        return {
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-100/80 hover:bg-slate-200/80',
          borderColor: 'border-slate-200',
          dotColor: 'bg-slate-400',
          icon: <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
        };
    }
  };

  const config = getStatusConfig(status);

  if (!interactive || !onChange) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.textColor}`}>
        {config.icon}
        <span>{status}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        className={`appearance-none text-xs font-medium pl-6 pr-5 py-1 rounded-md border ${config.borderColor} ${config.bgColor} ${config.textColor} focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors`}
      >
        <option value="Chưa cập nhật">Chưa cập nhật</option>
        <option value="Chưa thực hiện">Chưa thực hiện</option>
        <option value="Đang thực hiện">Đang thực hiện</option>
        <option value="Hoàn thành">Hoàn thành</option>
        <option value="Chậm tiến độ">Chậm tiến độ</option>
        <option value="Tạm hoãn">Tạm hoãn</option>
      </select>
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
        {config.icon}
      </div>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
    </div>
  );
};
