import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithAI } from "../services/aiService";

// Map-action keywords — handled locally without AI
const MAP_ACTIONS = [
  {
    keywords: ["hospital", "clinic", "medical", "doctor", "ambulance"],
    reply: "🏥 Showing nearby hospitals on the map. Click any marker for details.",
    action: "SHOW_HOSPITALS",
  },
  {
    keywords: ["police", "police station", "cop", "cops", "security"],
    reply: "🚓 Showing nearby police stations on the map.",
    action: "SHOW_POLICE",
  },
  {
    keywords: ["risk zone", "risk", "danger", "unsafe", "crime", "avoid"],
    reply: "🚨 Highlighting risk zones on the map. Red circles show dangerous areas — hover to see details.",
    action: "SHOW_RISK",
  },
];

const matchesMapAction = (text) => {
  const lower = text.toLowerCase();
  for (const entry of MAP_ACTIONS) {
    if (entry.keywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lower))) {
      return entry;
    }
  }
  return null;
};

const Chatbot = ({
  context,
  title = "Tourist Assistant",
  greeting = "Hi 👋 I am your Travel Safety Assistant. Ask me anything about tourist places, safety, food, hotels, directions, or emergency help!",
}) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: greeting, sender: "bot" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { text: userMsg, sender: "user" }]);
    setInput("");

    // Check for map-action keywords first (no AI needed)
    const mapAction = matchesMapAction(userMsg);
    if (mapAction) {
      setMessages((prev) => [...prev, { text: mapAction.reply, sender: "bot" }]);
      if (mapAction.action && context?.onAction) context.onAction(mapAction.action);
      return;
    }

    // Otherwise call Gemini AI for a real answer
    setLoading(true);
    try {
      const location = context?.location || null;
      const res = await chatWithAI(userMsg, location);
      const reply = res?.data?.reply || "Sorry, I couldn't get a response. Please try again.";
      setMessages((prev) => [...prev, { text: reply, sender: "bot" }]);
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Sorry, I'm having trouble connecting to the AI right now. Please check your connection and try again.",
          sender: "bot",
        },
      ]);
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
                  className={`px-3 py-2 rounded-xl text-sm max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white ml-auto rounded-br-none"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="bg-white text-gray-400 text-sm px-3 py-2 rounded-xl w-fit shadow-sm border border-gray-100 flex items-center gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
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
                placeholder="Ask anything..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-white placeholder-gray-400 disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
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
