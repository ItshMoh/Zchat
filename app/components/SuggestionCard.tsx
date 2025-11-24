'use client';
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SuggestionCardProps {
  icon: LucideIcon;
  text: string;
  onClick: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ icon: Icon, text, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col h-full justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl transition-all hover:scale-[1.02] text-left group"
  >
    <div className="p-2 bg-zinc-900 rounded-lg w-fit mb-3 group-hover:bg-zinc-700 transition-colors">
      <Icon className="w-5 h-5 text-blue-400" />
    </div>
    <span className="text-zinc-300 text-sm font-medium">{text}</span>
  </button>
);

export default SuggestionCard;
