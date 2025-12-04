'use client';
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Plus,
  Image as ImageIcon,
  Menu,
  Wallet,
  Sparkles,
  Code,
  Lightbulb,
  Compass,
  PanelLeftOpen
} from 'lucide-react';
import Sidebar from './Sidebar';
import SuggestionCard from './SuggestionCard';
import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  priceData?: {
    token: string;
    currency: string;
    dataPoints: { date: string; price: number }[];
  };
  hotelData?: any[];
}

// --- Main App Component ---

export default function App() {
  // Default to open on larger screens
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress] = useState('tmNXjJVuWeFeyHXoAjo29xzqmWELnjdCQ2d');
  const [chatId, setChatId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize or load chat session
  useEffect(() => {
    // Check if there's an existing chat_id in localStorage
    let existingChatId = localStorage.getItem('current_chat_id');

    if (!existingChatId) {
      // Generate new chat_id
      existingChatId = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('current_chat_id', existingChatId);
    }

    setChatId(existingChatId);

    // Load existing messages for this chat
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/chat/history?chat_id=${existingChatId}&wallet_id=${walletAddress}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            const loadedMessages = data.messages.map((msg: any, index: number) => ({
              id: Date.now() + index,
              text: msg.content,
              sender: msg.role === 'user' ? 'user' : 'bot'
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [walletAddress]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const userMsg: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Send to LLM API with chat persistence
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
          chat_id: chatId,
          wallet_id: walletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      const aiMsg: Message = {
        id: Date.now() + 1,
        text: data.message || "I'm here to help! Ask me about token prices, charities, or hotel bookings.",
        sender: 'bot',
        priceData: data.priceData || undefined,
        hotelData: data.hotelData || undefined,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error:', error);
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please try again.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-blue-500/30">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full transition-all duration-300">

        {/* Top Navigation Bar */}
        <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-10 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent">
          <div className="flex items-center gap-3">
            {/* Toggle Button - Visible when sidebar is closed or on mobile */}
            <button
              onClick={toggleSidebar}
              className={`p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors ${isSidebarOpen ? 'md:hidden' : 'flex'}`}
            >
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>

            {/* Logo in Header - Only visible when sidebar is closed on desktop, or always on mobile */}
            <div className={`font-bold text-lg bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent ${isSidebarOpen ? 'md:hidden' : 'block'}`}>
              Zchat
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWalletConnected(!isWalletConnected)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full text-zinc-300 transition-all group"
            >
              {isWalletConnected ? (
                <>
                  <span className="text-sm font-mono text-green-400 hidden sm:block">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                  </span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium hidden sm:block">Connect</span>
                  <Wallet className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                </>
              )}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 pt-20 pb-40 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="max-w-3xl mx-auto w-full">

            {messages.length === 0 ? (
              // Empty State / Welcome Screen
              <div className="mt-12 md:mt-24 fade-in-up">
                <div className="mb-10">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2 inline-block">
                    Welcome to Zchat.
                  </h1>
                  <h2 className="text-3xl md:text-4xl font-bold text-zinc-700">
                    Your Web3 AI Companion.
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SuggestionCard
                    icon={Sparkles}
                    text="I want to donate 2 ZEC to children cancer research"
                    onClick={() => setInput("I want to donate 2 ZEC to children cancer research")}
                  />
                  <SuggestionCard
                    icon={Lightbulb}
                    text="Book a hotel in Miami for 3 nights"
                    onClick={() => setInput("Book a hotel in Miami for 3 nights")}
                  />
                </div>
              </div>
            ) : (
              // Chat History
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center mt-1 shadow-lg shadow-blue-900/20">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed${msg.sender === 'user'
                        ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
                        : 'bg-transparent text-zinc-100 rounded-tl-sm'
                        }`}
                    >
                      {msg.sender === 'bot' ? (
                        <MarkdownRenderer content={msg.text} priceData={msg.priceData} hotelData={msg.hotelData} />
                      ) : (
                        msg.text
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center mt-1">
                        <Wallet className="w-4 h-4 text-zinc-300" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center mt-1">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5 h-10 px-2">
                      <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Floating Input Area */}
        <div className={`fixed bottom-0 right-0 p-4 pb-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'left-0 md:left-64' : 'left-0'}`}>
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50 rounded-[2rem] p-2 shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-zinc-600">

              {/* Left Action Button */}
              <button className="p-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-full transition-colors flex-shrink-0">
                <Plus className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Zchat..."
                className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-base max-h-48 py-3 focus:outline-none resize-none scrollbar-hide"
                rows={1}
                style={{ minHeight: '44px' }}
              />

              {/* Right Action Buttons */}
              <div className="flex items-center gap-1 pb-1 pr-1">
                <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-full transition-colors" title="Upload Image">
                  <ImageIcon className="w-5 h-5" />
                </button>

                {input.trim().length > 0 ? (
                  <button
                    onClick={handleSend}
                    className="p-2 bg-blue-500 hover:bg-blue-400 text-white rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/20"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                ) : (
                  <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-full transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-center mt-3">
              <p className="text-[10px] text-zinc-500">
                Zchat AI can make mistakes. Verify important info on-chain.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}