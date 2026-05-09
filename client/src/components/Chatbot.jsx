import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithAI } from "../services/aiService";
import { getBotResponse } from "../utils/chatbotLogic";

const Chatbot = ({ context, title = "Travel Assistant", greeting = "Hi 👋 I am your Travel Safety Assistant. How can I help?" }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: greeting, sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { text: userMsg, sender: "user" }]);
    setInput("");

    const { reply, action } = getBotResponse(userMsg, context);

    if (reply && reply !== "default") {
      setMessages((prev) => [...prev, { text: reply, sender: "bot" }]);
      if (action && context?.onAction) context.onAction(action);
      return;
    }

    try {
      setLoading(true);
      const locationHint = context?.placeName || context?.pageHint || "unknown";
      const res = await chatWithAI(userMsg, locationHint);
      setMessages((prev) => [...prev, { text: res.data.reply, sender: "bot" }]);
    } catch {
      setMessages((prev) => [...prev, { text: "⚠️ AI not available right now.", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-2xl z-50 flex items-center justify-center text-2xl"
      >
        {open ? "✕" : "💬"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 h-[460px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200"
          >
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-3 font-semibold flex items-center gap-2">
              <span>🤖</span>
              <span>{title}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-xl text-sm max-w-[80%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white ml-auto rounded-br-none"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="bg-white text-gray-400 text-sm px-3 py-2 rounded-xl w-fit shadow-sm border border-gray-100">
                  typing...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-2 flex gap-2 border-t bg-white">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask something..."
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-white placeholder-gray-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-sm transition"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
