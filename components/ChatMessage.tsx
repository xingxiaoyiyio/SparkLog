import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { Bot, User, Link as LinkIcon, Trash2 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onDelete: (id: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onDelete }) => {
  const isUser = message.role === Role.USER;

  // Auto-linkify user text if no markdown links detected
  // This ensures raw URLs pasted by the user become clickable
  const formattedText = React.useMemo(() => {
    if (!isUser) return message.text;
    
    // If text already contains markdown links (e.g. [title](url)), assume user (or system) formatted it intentionally
    if (/\[.*?\]\(.*?\)/.test(message.text)) return message.text;

    // Replace raw URLs with markdown links
    return message.text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
        // Strip common trailing punctuation from URL to avoid including "." or "," in the link
        const url = match.replace(/[.,;!?)]+$/, '');
        const suffix = match.slice(url.length);
        return `[${url}](${url})${suffix}`;
    });
  }, [message.text, isUser]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in-up group`}>
      <div className={`flex max-w-[95%] md:max-w-[80%] gap-3 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-sm border mb-1 ${
          isUser 
            ? 'bg-gradient-to-br from-aurora-purple to-violet-600 border-aurora-purple text-white' 
            : 'bg-white border-white/60 text-aurora-purple'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Message Group (Bubble + Delete Btn) */}
        <div className={`flex gap-2 items-center ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Bubble */}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} relative max-w-full`}>
                <div className={`px-5 py-3.5 shadow-sm text-sm md:text-base leading-relaxed overflow-hidden border backdrop-blur-sm ${
                    isUser 
                    ? 'bg-aurora-purple text-white rounded-2xl rounded-tr-sm border-aurora-purple/20' 
                    : 'bg-white/80 text-slate-700 rounded-2xl rounded-tl-sm border-white/60'
                }`}>
                    {message.image && (
                    <div className="mb-3">
                        <img 
                        src={`data:image/jpeg;base64,${message.image}`} 
                        alt="User upload" 
                        className="rounded-lg max-h-60 object-cover w-full border border-black/5"
                        />
                    </div>
                    )}
                    
                    <div className={`markdown-content break-words break-all overflow-wrap-anywhere ${isUser ? 'text-white' : 'text-slate-700'}`}>
                    <ReactMarkdown 
                        components={{
                            a: ({node, ...props}) => (
                                <a 
                                    {...props} 
                                    className={`underline ${isUser ? 'text-white/90 hover:text-white' : 'text-aurora-purple hover:text-aurora-purple/80'} break-all cursor-pointer transition-opacity`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                />
                            )
                        }}
                    >
                        {formattedText}
                    </ReactMarkdown>
                    </div>
                </div>

                {/* Grounding Sources (Citations) */}
                {message.groundingSources && message.groundingSources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 max-w-full">
                        {message.groundingSources.map((source, idx) => (
                            <a 
                                key={idx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] bg-white/60 border border-white text-slate-500 px-2 py-1.5 rounded-md hover:border-aurora-green hover:text-aurora-green transition-colors shadow-sm max-w-full cursor-pointer"
                            >
                                <LinkIcon size={10} className="flex-shrink-0" />
                                <span className="truncate font-mono">{source.title}</span>
                            </a>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2 mt-1.5 opacity-70">
                    <span className="text-[10px] font-mono text-slate-400 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(message.id);
                }}
                className={`flex-shrink-0 p-2 text-slate-300 hover:text-red-400 rounded-full hover:bg-red-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100`}
                title="删除此条"
                aria-label="Delete message"
            >
                <Trash2 size={16} />
            </button>

        </div>
      </div>
    </div>
  );
};
