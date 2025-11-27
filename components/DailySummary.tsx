import React, { useState } from 'react';
import { DailySummaryData } from '../types';
import { CheckCircle2, Lightbulb, Calendar, Sparkles, PieChart, List, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DailySummaryProps {
  data: DailySummaryData;
  onClose: () => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ data, onClose }) => {
  const [showAllLogs, setShowAllLogs] = useState(false);
  const logs = data.rawLog || data.fragmentLog || [];
  const displayLogs = showAllLogs ? logs : logs.slice(0, 3);
  const hasMoreLogs = logs.length > 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/90 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col relative border border-white/60">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/50 hover:bg-white text-slate-500 rounded-full p-2 transition-all shadow-sm backdrop-blur-md border border-slate-200/50"
        >
           <X size={20} />
        </button>

        {/* Mood Header - Aurora Style */}
        <div 
            className="relative h-48 w-full flex-shrink-0 flex flex-col items-center justify-center p-6 text-center overflow-hidden"
            style={{ 
                background: `linear-gradient(135deg, ${data.moodColor}15, #ffffff)`,
                borderBottom: `1px solid ${data.moodColor}20`
            }}
        >
          {/* Decorative gradients */}
          <div className="absolute top-[-50%] left-[-20%] w-60 h-60 rounded-full bg-aurora-purple/10 blur-3xl"></div>
          <div className="absolute bottom-[-30%] right-[-10%] w-40 h-40 rounded-full bg-aurora-green/10 blur-3xl"></div>

          <div 
            className="text-7xl drop-shadow-sm z-10 mb-2 transform hover:scale-105 transition-transform cursor-default"
          >
            {data.moodEmoji || '✨'}
          </div>
          
          <div className="flex items-center gap-2 text-slate-500 font-mono text-xs font-semibold bg-white/60 backdrop-blur-md py-1.5 px-4 rounded-full border border-white/50 shadow-sm z-10">
             <Calendar size={12} />
             <span>{data.date}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 bg-gradient-to-b from-white to-slate-50/80">
          
          {/* Highlight (Point-by-point) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-aurora-purple uppercase tracking-widest flex items-center gap-2 font-mono opacity-90">
                <Sparkles size={14} />
                今日高光 (Highlights)
            </h3>
            <ul className="space-y-3">
                {data.highlight.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 group">
                         <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-aurora-purple group-hover:bg-aurora-green transition-colors flex-shrink-0 shadow-sm" />
                         <span className="text-slate-700 text-sm leading-relaxed">{point}</span>
                    </li>
                ))}
            </ul>
          </div>

          {/* Stats Section */}
          {data.stats && data.stats.length > 0 && (
             <div className="space-y-4">
                 <h3 className="text-xs font-bold text-aurora-green uppercase tracking-widest flex items-center gap-2 font-mono opacity-90">
                    <PieChart size={14} />
                    数据统计 (Stats)
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                    {data.stats.map((stat, idx) => (
                        <div key={idx} className="bg-aurora-green/5 border border-aurora-green/20 p-3 rounded-xl flex flex-col items-start">
                             <span className="text-[10px] text-aurora-green/80 font-mono uppercase mb-1">{stat.label}</span>
                             <span className="text-lg font-bold text-slate-700">{stat.value}</span>
                        </div>
                    ))}
                 </div>
             </div>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Action Items */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 font-mono opacity-90">
                <CheckCircle2 size={14} />
                待办 & 行动 (Actions)
             </h3>
             {data.actionItems.length > 0 ? (
                <ul className="space-y-2">
                  {data.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white p-2.5 rounded-lg border border-slate-100 hover:border-aurora-green/30 transition-colors shadow-sm">
                      <div className="mt-0.5 w-4 h-4 border-2 border-aurora-green rounded-full flex items-center justify-center flex-shrink-0"></div>
                      <span className="text-slate-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
             ) : (
                <p className="text-slate-400 text-xs italic font-mono pl-2">NO ACTIVE TASKS</p>
             )}
          </div>

          {/* Inspirations */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 font-mono opacity-90">
                <Lightbulb size={14} />
                灵感碎片 (Inspirations)
             </h3>
             {data.inspirations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.inspirations.map((item, idx) => (
                    <span key={idx} className="bg-aurora-purple/5 text-slate-700 border border-aurora-purple/10 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-aurora-purple/10 transition-colors">
                      {item}
                    </span>
                  ))}
                </div>
             ) : (
                <p className="text-slate-400 text-xs italic font-mono pl-2">DATA FRAGMENTS EMPTY</p>
             )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Fragment Log (Raw Details) */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <List size={14} />
                记录明细 (Log)
             </h3>
             <div className="space-y-3">
                {logs.length > 0 ? (
                    <>
                        {displayLogs.map((log, idx) => (
                            <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-600">
                                <p className="line-clamp-2 leading-relaxed">{log}</p>
                            </div>
                        ))}
                        
                        {hasMoreLogs && (
                            <button 
                                onClick={() => setShowAllLogs(!showAllLogs)}
                                className="w-full py-2 text-xs text-aurora-purple hover:text-aurora-purple/80 font-medium flex items-center justify-center gap-1 transition-colors bg-white border border-slate-100 rounded-lg"
                            >
                                {showAllLogs ? (
                                    <>收起 <ChevronUp size={12} /></>
                                ) : (
                                    <>查看更多 ({logs.length - 3}) <ChevronDown size={12} /></>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    <p className="text-slate-300 text-xs italic">没有详细记录</p>
                )}
             </div>
          </div>

        </div>

        {/* Decorative Footer */}
        <div className="h-1.5 bg-gradient-to-r from-aurora-purple via-white to-aurora-green"></div>
      </div>
    </div>
  );
};