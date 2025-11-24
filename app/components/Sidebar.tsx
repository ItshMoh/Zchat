'use client';
import React from 'react';
import { PanelLeftClose } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-30 bg-zinc-900 border-r border-zinc-800 
        transition-all duration-300 ease-in-out flex flex-col flex-shrink-0
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:w-0 md:-translate-x-0'}
        ${!isOpen && 'overflow-hidden'} // Hide content when collapsed
      `}
    >
      <div className="flex flex-col h-full p-4 w-64"> {/* Fixed width container to prevent layout squishing during transition */}
        
        {/* Sidebar Header with Logo and Collapse Button */}
        <div className="flex items-center justify-between mb-8 mt-2">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Zchat
          </span>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Recent Chats List */}
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Recent</div>
          {['Smart Contract Audit', 'Solidity Gas Optimization', 'DeFi Protocol Ideas', 'NFT Metadata JSON'].map((item, i) => (
            <button key={i} className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors truncate">
              {item}
            </button>
          ))}
        </div>

        {/* Removed John Doe User Profile Section */}
      </div>
    </div>
  );
};

export default Sidebar;
