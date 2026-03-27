import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Terminal, Info, AlertTriangle, BookOpen, Layers, ShieldCheck, RefreshCcw, ChevronDown, Home, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Message, WSO2Product } from './types';
import { getGeminiResponse } from './services/geminiService';

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
      content: 'Thinking...',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await getGeminiResponse(
        input,
        selectedProduct,
        selectedVersion
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: response }
            : msg
        )
      );
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "I encountered an error while processing your request." }
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
      {/* KEEP YOUR EXISTING UI BELOW UNCHANGED */}
      {/* No changes needed in JSX */}
      {/* Your entire UI remains exactly the same */}
      
      {/* (rest of your UI stays untouched) */}
    </div>
  );
}
