import React from 'react';
import { DailySummaryData } from '../types';
import { Calendar, ChevronRight, Trash2, PieChart } from 'lucide-react';

interface HistoryViewProps {
  history: { data: DailySummaryData; id: number }[];
  onSelect: (data: DailySummaryData) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-50/90 w-full max-w-lg h-[85vh] md:h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border border-white/60">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md p-5 border-b border-white/50 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <Calendar className="text-aurora-purple" size={24} />
                时光机 (History)
            </h2>
            <button 
                onClick={onClose}
                className="bg-white hover:bg-slate-100 text-slate-600 rounded-full p-2 transition-colors border border-slate-100"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <Calendar size={32} className="opacity-40" />
                    </div>
                    <p className="text-lg font-medium">还没有历史日记哦</p>
                    <p className="text-sm mt-2 opacity-70">和 SparkLog 聊聊，生成你的第一篇日结！</p>
                </div>
            ) : (
                [...history].reverse().map((item) => (
                    <div 
                        key={item.id}
                        className="w-full bg-white/80 p-4 rounded-2xl shadow-sm border border-white hover:border-aurora-purple/30 hover:shadow-md transition-all flex gap-4 group relative overflow-hidden"
                    >
                        {/* Clickable Area for Selection */}
                        <div 
                            className="flex-1 flex gap-4 cursor-pointer"
                            onClick={() => onSelect(item.data)}
                        >
                            {/* Mood Icon/Color */}
                            <div 
                                className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-inner border border-black/5"
                                style={{ backgroundColor: `${item.data.moodColor}20` }} // 20% opacity
                            >
                                {item.data.moodEmoji || '📅'}
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-slate-700 font-mono text-sm">{item.data.date}</h3>
                                    {item.data.stats && item.data.stats.length > 0 && (
                                        <div className="flex items-center gap-1 text-[10px] text-aurora-green bg-aurora-green/5 border border-aurora-green/10 px-1.5 py-0.5 rounded-md">
                                            <PieChart size={10} />
                                            <span>Stats</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                    {item.data.highlight && item.data.highlight.length > 0 
                                        ? item.data.highlight[0] 
                                        : "今日暂无高光记录"}
                                    {item.data.highlight.length > 1 && "..."}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-between items-end pl-2 border-l border-slate-50">
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item.id);
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除"
                             >
                                <Trash2 size={16} />
                             </button>
                             <div className="p-2 text-slate-300 group-hover:text-aurora-purple transition-colors">
                                <ChevronRight size={18} />
                             </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};