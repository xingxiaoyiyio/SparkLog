'use client';

import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string, image?: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
        // Reset height to auto to get the correct scrollHeight
        textareaRef.current.style.height = 'auto';
        // Set new height based on content, capped at roughly 128px (max-h-32)
        const newHeight = Math.min(textareaRef.current.scrollHeight, 128);
        textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !previewImage) || isLoading) return;

    let imageBase64 = undefined;
    if (previewImage) {
        imageBase64 = previewImage.split(',')[1];
    }

    onSendMessage(text, imageBase64);
    setText('');
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Reset height manually after send
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel sticky bottom-0 z-20 pb-safe shadow-[0_-5px_30px_rgba(139,92,246,0.05)]">
      <div className="max-w-2xl mx-auto p-4">
        {previewImage && (
            <div className="mb-3 relative inline-block animate-fade-in-up">
            <img 
                src={previewImage} 
                alt="Preview" 
                className="h-24 w-24 object-cover rounded-xl shadow-md border border-white"
            />
            <button 
                onClick={() => {
                setPreviewImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 shadow-md hover:bg-slate-900 transition-colors"
            >
                <X size={12} />
            </button>
            </div>
        )}
        
        <div className="flex items-end gap-3">
            <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 text-slate-400 hover:text-aurora-purple hover:bg-aurora-purple/5 border border-transparent hover:border-aurora-purple/10 rounded-2xl transition-all flex-shrink-0 mb-[1px]"
            disabled={isLoading}
            >
            <ImageIcon size={22} />
            </button>
            <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
            />
            
            <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="记录碎片 (记账、学习、思考、吐槽...）"
            className="flex-1 bg-white/80 text-slate-800 placeholder-slate-400 border border-white/50 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-aurora-purple/20 focus:border-aurora-purple/40 outline-none resize-none max-h-32 min-h-[52px] shadow-sm transition-all font-sans overflow-y-auto scrollbar-hide"
            rows={1}
            style={{ overflowY: text.length > 100 ? 'auto' : 'hidden' }} // Show scroll only if long
            />
            
            <button
            onClick={handleSend}
            disabled={(!text.trim() && !previewImage) || isLoading}
            className={`p-3.5 rounded-2xl flex-shrink-0 transition-all shadow-md mb-[1px] ${
                (!text.trim() && !previewImage) || isLoading
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-br from-aurora-purple to-aurora-purple text-white hover:brightness-110 active:scale-95 shadow-aurora-purple/30'
            }`}
            >
            {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
            </button>
        </div>
      </div>
    </div>
  );
};