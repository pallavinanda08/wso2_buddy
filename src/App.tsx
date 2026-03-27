import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Terminal, Info, AlertTriangle, BookOpen, Layers, ShieldCheck, RefreshCcw, ChevronDown, Home, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Message, WSO2Product } from './types';
import { getGeminiResponseStream } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PRODUCT_VERSIONS: Record<WSO2Product, string[]> = {
  APIM: ['4.6.0 (Latest)', '4.5.0', '4.4.0', '4.3.0', '4.2.0', '4.1.0', '4.0.0'],
  MI: ['4.5.0 (Latest)', '4.4.0', '4.3.0', '4.2.0', '4.1.0'],
  IS: ['7.1.0 (Latest)', '7.0.0', '6.1.0', '6.0.0'],
  UNKNOWN: ['Latest']
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am **WSO2 Buddy**, your expert documentation guide.\n\nPlease **select your WSO2 product and version** from the dropdown menu in the header above to get started.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WSO2Product>('UNKNOWN');
  const [selectedVersion, setSelectedVersion] = useState<string>('Latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const stream = getGeminiResponseStream([...messages, userMessage], selectedProduct, selectedVersion);
      let fullContent = '';
      let lastUpdate = Date.now();
      
      for await (const chunk of stream) {
        fullContent += chunk;
        
        // Throttle state updates to every 50ms to reduce re-renders during fast streaming
        const now = Date.now();
        if (now - lastUpdate > 50) {
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
            )
          );
          lastUpdate = now;
        }
      }
      
      // Final update to ensure everything is captured
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
        )
      );
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMessageId 
            ? { ...msg, content: "I encountered an error while processing your request. Please try again or verify your configuration." } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I am **WSO2 Buddy**, your expert documentation guide.\n\nPlease **select your WSO2 product and version** from the dropdown menu in the header above to get started.",
        timestamp: Date.now(),
      },
    ]);
    setSelectedProduct('UNKNOWN');
    setSelectedVersion('Latest');
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleProductChange = (product: WSO2Product) => {
    setSelectedProduct(product);
    setSelectedVersion(PRODUCT_VERSIONS[product][0]);
  };

  const suggestedQuestions = [
    "How do I configure a JWT grant type in IS?",
    "What are the steps to deploy a sequence in MI?",
    "How to enable rate limiting in APIM 4.2?",
    "Troubleshoot '401 Unauthorized' in API Gateway.",
  ];

  const handleSuggestedClick = (q: string) => {
    setInput(q);
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(m => m.content.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white shadow-2xl overflow-hidden sm:border-x border-gray-200">
      {/* Header - Narrower */}
      <header className="bg-wso2-dark text-white py-2 px-2 sm:px-6 flex items-center justify-between border-b-2 border-wso2-orange relative overflow-hidden h-12 sm:h-14">
        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute inset-0 bg-wso2-dark z-20 flex items-center px-2 sm:px-4 gap-2 sm:gap-3"
            >
              <Search size={16} className="text-wso2-orange sm:w-[18px] sm:h-[18px]" />
              <input 
                autoFocus
                type="text"
                placeholder="Search chat history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm font-medium placeholder:text-gray-500"
              />
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400 hover:text-white sm:w-[18px] sm:h-[18px]" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button 
          onClick={resetChat}
          className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity text-left focus:outline-none group flex-shrink-0"
          title="Go to Home / Reset Chat"
        >
          <div className="bg-wso2-orange p-1 sm:p-1.5 rounded-md group-hover:scale-105 transition-transform">
            <Bot size={14} className="text-white sm:w-5 sm:h-5" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-xs sm:text-lg font-bold tracking-tight flex items-center gap-1 sm:gap-2">
              WSO2 Buddy <span className="text-[6px] sm:text-[8px] bg-wso2-orange px-1 py-0.5 rounded uppercase font-black">v1.0</span>
            </h1>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium leading-none">Expert Documentation Guide</p>
          </div>
        </button>

        <div className="flex items-center gap-1 sm:gap-3">
          <div className="flex items-center gap-0.5 sm:gap-2 bg-white/5 p-0.5 sm:p-1 rounded-lg border border-white/10">
            <button 
              onClick={resetChat}
              className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
              title="Home / Reset"
            >
              <Home size={10} className="sm:w-[14px] sm:h-[14px]" />
            </button>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="relative">
              <select 
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value as WSO2Product)}
                className="appearance-none bg-transparent text-[8px] sm:text-[10px] font-bold text-gray-300 hover:text-white pl-1 sm:pl-2 pr-4 sm:pr-6 py-1 cursor-pointer focus:outline-none uppercase tracking-wider"
              >
                <option value="UNKNOWN" className="bg-wso2-dark">Product</option>
                <option value="APIM" className="bg-wso2-dark">APIM</option>
                <option value="MI" className="bg-wso2-dark">MI</option>
                <option value="IS" className="bg-wso2-dark">IS</option>
              </select>
              <ChevronDown size={6} className="absolute right-0.5 sm:right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none sm:w-[10px] sm:h-[10px]" />
            </div>
            
            <div className="w-px h-3 bg-white/10"></div>

            <div className="relative">
              <select 
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                disabled={selectedProduct === 'UNKNOWN'}
                className="appearance-none bg-transparent text-[8px] sm:text-[10px] font-bold text-gray-300 hover:text-white pl-1 sm:pl-2 pr-4 sm:pr-6 py-1 cursor-pointer focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {PRODUCT_VERSIONS[selectedProduct].map(v => (
                  <option key={v} value={v} className="bg-wso2-dark">{v}</option>
                ))}
              </select>
              <ChevronDown size={6} className="absolute right-0.5 sm:right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none sm:w-[10px] sm:h-[10px]" />
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block"></div>

          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Search Chat"
          >
            <Search size={12} className="sm:w-4 sm:h-4" />
          </button>

          <button 
            onClick={resetChat}
            className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white hidden sm:block"
            title="Reset Conversation"
          >
            <RefreshCcw size={12} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Chat Area - Larger */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 scroll-smooth bg-[#fafafa]"
      >
        {searchQuery && filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Search size={48} className="opacity-20" />
            <p className="text-sm font-medium">No messages found matching "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-wso2-orange text-xs font-bold hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
        <AnimatePresence initial={false}>
          {filteredMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[95%]",
                message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2",
                message.role === 'user' 
                  ? "bg-gray-100 border-gray-200 text-gray-600" 
                  : "bg-wso2-orange/10 border-wso2-orange/20 text-wso2-orange"
              )}>
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={cn(
                "flex flex-col gap-1",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-xl text-sm shadow-sm",
                  message.role === 'user' 
                    ? "bg-wso2-dark text-white rounded-tr-none" 
                    : "bg-white border border-gray-200 rounded-tl-none"
                )}>
                  {message.role === 'assistant' ? (
                    <div className="markdown-body prose prose-sm max-w-none">
                      <Markdown
                        components={{
                          p: ({ children }) => {
                            // Check if children contains "Source:" or "[Verified for:"
                            const childrenArray = Array.isArray(children) ? children : [children];
                            const isSource = childrenArray.some(child => 
                              typeof child === 'string' && (child.includes("Source:") || child.includes("[Verified for:"))
                            );
                            
                            if (isSource) {
                              return <p className="source-footer">{children}</p>;
                            }
                            return <p>{children}</p>;
                          },
                          a: ({ children, href }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-wso2-orange hover:underline font-medium">
                              {children}
                            </a>
                          )
                        }}
                      >
                        {message.content}
                      </Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 mr-auto max-w-[95%]"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-wso2-orange/10 border-wso2-orange/20 text-wso2-orange">
              <Bot size={16} className="animate-pulse" />
            </div>
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-wso2-orange rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-wso2-orange rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-wso2-orange rounded-full animate-bounce"></span>
              </div>
            </div>
          </motion.div>
        )}

        {messages.length === 1 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4"
          >
            <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Suggested Topics</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedClick(q)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-wso2-orange hover:shadow-md transition-all text-[11px] text-gray-600 font-medium group flex items-start gap-2"
                >
                  <BookOpen size={12} className="text-wso2-orange mt-0.5 group-hover:scale-110 transition-transform" />
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area - Narrower */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center gap-2">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about APIM, MI, or IS..."
              className="w-full pl-3 sm:pl-4 pr-10 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wso2-orange/50 focus:border-wso2-orange transition-all resize-none text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-wso2-orange text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-wso2-orange transition-colors shadow-lg shadow-orange-500/20"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2 sm:gap-4 justify-center items-center">
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            <Layers size={8} className="text-wso2-orange sm:w-[10px] sm:h-[10px]" />
            APIM
          </div>
          <div className="w-px h-2 bg-gray-200"></div>
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            <Terminal size={8} className="text-wso2-orange sm:w-[10px] sm:h-[10px]" />
            MI
          </div>
          <div className="w-px h-2 bg-gray-200"></div>
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            <ShieldCheck size={8} className="text-wso2-orange sm:w-[10px] sm:h-[10px]" />
            IS
          </div>
        </div>
      </div>
    </div>
  );
}
