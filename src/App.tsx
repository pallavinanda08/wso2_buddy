import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import Markdown from "react-markdown";
import { getGeminiResponse } from "./services/geminiService";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type WSO2Product = "APIM" | "MI" | "IS" | "UNKNOWN";

const PRODUCT_VERSIONS: Record<WSO2Product, string[]> = {
  APIM: ["4.6.0", "4.5.0", "4.4.0", "4.3.0"],
  MI: ["4.5.0", "4.4.0", "4.3.0"],
  IS: ["7.1.0", "7.0.0", "6.1.0"],
  UNKNOWN: ["Latest"],
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I am **WSO2 Buddy**.\n\nPlease select your product and version first.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<WSO2Product>("UNKNOWN");
  const [selectedVersion, setSelectedVersion] =
    useState<string>("Latest");

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
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "Thinking..." },
    ]);

    try {
      const reply = await getGeminiResponse(
        input,
        selectedProduct,
        selectedVersion
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, content: reply } : msg
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  "Error occurred. Please check configuration and try again.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedProduct}
          onChange={(e) =>
            setSelectedProduct(e.target.value as WSO2Product)
          }
        >
          <option value="UNKNOWN">Product</option>
          <option value="APIM">APIM</option>
          <option value="MI">MI</option>
          <option value="IS">IS</option>
        </select>

        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          disabled={selectedProduct === "UNKNOWN"}
        >
          {PRODUCT_VERSIONS[selectedProduct].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Chat */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto border p-4 rounded"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 mb-4 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && <Bot />}
            <div className="bg-gray-100 p-3 rounded max-w-lg">
              <Markdown>{msg.content}</Markdown>
            </div>
            {msg.role === "user" && <User />}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Ask something..."
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-black text-white px-4 rounded"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
