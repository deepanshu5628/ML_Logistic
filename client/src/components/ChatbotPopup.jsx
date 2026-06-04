import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, IconButton, TextField, Fab } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MinimizeIcon from "@mui/icons-material/Remove";
import axiosInstance from "../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion.create(Box);

const TypingDots = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 2, py: 1.5 }}>
    {[0, 1, 2].map((i) => (
      <Box key={i} sx={{
        width: 7, height: 7, borderRadius: "50%", bgcolor: "#90a4ae",
        animation: "typingBounce 1.2s infinite",
        animationDelay: `${i * 0.2}s`,
        "@keyframes typingBounce": {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-6px)" }
        }
      }} />
    ))}
  </Box>
);

const QuickAction = ({ label, onClick }) => (
  <Box onClick={onClick} sx={{
    px: 1.5, py: 0.6, borderRadius: "20px", cursor: "pointer",
    border: "1px solid #c5cae9", color: "#1a237e", fontSize: "0.75rem",
    fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s",
    "&:hover": { bgcolor: "#e8eaf6", borderColor: "#1a237e" }
  }}>
    {label}
  </Box>
);

const ChatbotPopup = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! 👋 How can I help you with your parcels today?", time: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [mode, setMode] = useState("NORMAL");
  const [step, setStep] = useState(0);
  const [parcelData, setParcelData] = useState({
    product: "", weight: "", description: "", name: "", contact: "", destination: ""
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const sessionId = React.useMemo(() => {
    let id = localStorage.getItem("chat_session_id");
    if (!id) {
      id = "sess-" + Math.random().toString(36).slice(2);
      localStorage.setItem("chat_session_id", id);
    }
    return id;
  }, []);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, botTyping]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const parcelQuestions = [
    "📦 What is the product name?",
    "⚖️ What is the weight (in kg)?",
    "📝 Give a short description",
    "👤 Receiver name?",
    "📞 Receiver contact number?",
    "📍 Destination address?"
  ];
  const parcelKeys = ["product", "weight", "description", "name", "contact", "destination"];

  const isCreateParcelIntent = (text) => {
    const t = text.toLowerCase();
    return t.includes("create parcel") || t.includes("new parcel") || t.includes("send parcel") || t.includes("book parcel");
  };

  const addMsg = (sender, text, type = "text") =>
    setMessages(prev => [...prev, { sender, text, time: new Date(), type }]);

  const showCategoryPicker = () => {
    addMsg("bot", "Select a category to view your parcels:", "categories");
  };

  const startParcelCreation = () => {
    setMode("CREATE_PARCEL");
    setStep(0);
    setParcelData({ product: "", weight: "", description: "", name: "", contact: "", destination: "" });
    setMessages(prev => [
      ...prev,
      { sender: "bot", text: "📦 Sure! Let's create a new parcel.", time: new Date() },
      { sender: "bot", text: parcelQuestions[0], time: new Date() }
    ]);
  };

  const handleParcelAnswer = async () => {
    const key = parcelKeys[step];
    const value = input.trim();
    if (!value) return;

    const updatedData = { ...parcelData, [key]: value };
    setParcelData(updatedData);
    addMsg("user", value);
    setInput("");

    if (step < parcelQuestions.length - 1) {
      setStep(step + 1);
      setTimeout(() => addMsg("bot", parcelQuestions[step + 1]), 400);
      return;
    }

    try {
      setLoading(true);
      setBotTyping(true);
      const res = await axiosInstance.post("/parcel/createParcel", { ...updatedData, source: "CHATBOT" });
      addMsg("bot", `✅ Parcel created successfully!\n📦 Parcel ID: ${res.data.data.parcelId}`);
    } catch {
      addMsg("bot", "❌ Failed to create parcel. Please try again.");
    } finally {
      setMode("NORMAL");
      setStep(0);
      setLoading(false);
      setBotTyping(false);
    }
  };

  const downloadInvoice = async (parcelId) => {
    try {
      // const BASE_URL = ; // or from env
      // const url = `${BASE_URL}/parcel/invoice/${parcelId}`;

      // const response = await axiosInstance.get(url, {
        // responseType: "blob",
      // });

      const response = await axiosInstance.get(`/parcel/invoice/${parcelId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `Invoice_${parcelId}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch {
      addMsg("bot", "❌ Failed to download invoice.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input;

    if (mode === "CREATE_PARCEL") { handleParcelAnswer(); return; }

    addMsg("user", userText);

    if (isCreateParcelIntent(userText)) { setInput(""); startParcelCreation(); return; }

    setInput("");
    setLoading(true);
    setBotTyping(true);

    try {
      // const res = await axiosInstance.post("/chatbot", { message: userText }, { headers: { "x-chat-session": sessionId } });
      const res = await axiosInstance.post("/langchain_chatbot", { message: userText }, { headers: { "x-chat-session": sessionId } });
      const data = res.data || {};
      const reply = data.reply || "No response.";
      addMsg("bot", reply);
      // ✅ Step 1: lowercase check
      const lowerReply = reply.toLowerCase();
      if (lowerReply.includes("invoice generation")) {
        console.log("in setp1");

        // ✅ Step 2: extract parcelId
        const match = reply.match(/P-IDX[A-Z0-9]+/);
        if (match && match[0]) {
          console.log("in setp2");
          const parcelId = match[0];

          // ✅ Step 3: strict validation
          console.log("in setp3");
          if (parcelId.startsWith("P-IDX")) {
            downloadInvoice(parcelId);
          }
        }
      }

      // if (data.success && data.downloadUrl) {
      //   downloadInvoice(data.downloadUrl);
      // }

    } catch {
      addMsg("bot", "Server error. Try again later.");
    }

    setLoading(false);
    setBotTyping(false);
  };

  const handleQuickAction = (text) => {
    setInput(text);
    setTimeout(() => {
      setInput(text);
      const fakeEvent = { trim: () => text };
      setMessages(prev => [...prev, { sender: "user", text, time: new Date() }]);

      if (isCreateParcelIntent(text)) { startParcelCreation(); return; }

      setLoading(true);
      setBotTyping(true);
      axiosInstance.post("/chatbot", { message: text }, { headers: { "x-chat-session": sessionId } })
        .then(res => {
          const data = res.data || {};
          addMsg("bot", data.reply || "No response.");
          if (data.success && data.downloadUrl) {
            downloadInvoice(data.downloadUrl);
          }
        })
        .catch(() => addMsg("bot", "Server error. Try again later."))
        .finally(() => { setLoading(false); setBotTyping(false); });

      setInput("");
    }, 50);
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <MotionBox
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 10000 }}
          >
            <Fab onClick={() => setOpen(true)}
              sx={{
                width: 60, height: 60,
                background: "linear-gradient(135deg, #1a237e, #1565c0)",
                boxShadow: "0 8px 32px rgba(21,101,192,0.4)",
                "&:hover": { background: "linear-gradient(135deg, #0d1b6e, #0d47a1)", transform: "scale(1.05)" },
                transition: "all 0.3s",
                // Pulse ring
                "&::before": {
                  content: '""', position: "absolute", width: "100%", height: "100%",
                  borderRadius: "50%", border: "3px solid rgba(21,101,192,0.4)",
                  animation: "fabPulse 2s infinite",
                  "@keyframes fabPulse": {
                    "0%": { transform: "scale(1)", opacity: 1 },
                    "100%": { transform: "scale(1.6)", opacity: 0 }
                  }
                }
              }}
            >
              <ChatIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Fab>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <MotionBox
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            sx={{
              position: "fixed", bottom: 24, right: 24, zIndex: 9999,
              width: { xs: "calc(100vw - 32px)", sm: 400 },
              height: { xs: "70vh", sm: 560 },
              borderRadius: "20px", overflow: "hidden",
              display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.2)"
            }}
          >
            {/* Header */}
            <Box sx={{
              background: "linear-gradient(135deg, #1a237e, #1565c0)",
              px: 2.5, py: 2,
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: "12px",
                  bgcolor: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative"
                }}>
                  <SmartToyIcon sx={{ color: "#fff", fontSize: 22 }} />
                  {/* Online dot */}
                  <Box sx={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%",
                    bgcolor: "#4caf50", border: "2px solid #1a237e"
                  }} />
                </Box>
                <Box>
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>
                    Parcel Assistant
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", fontWeight: 500 }}>
                    Always online • Instant replies
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton size="small" onClick={() => setOpen(false)}
                  sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
                  <MinimizeIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" onClick={() => setOpen(false)}
                  sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Messages Area */}
            <Box sx={{
              flex: 1, overflowY: "auto", px: 2, py: 2,
              bgcolor: "#f8f9fc",
              display: "flex", flexDirection: "column", gap: 0.5,
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": { bgcolor: "#c5cae9", borderRadius: 2 }
            }}>
              {messages.map((msg, i) => {
                const isUser = msg.sender === "user";
                const showAvatar = !isUser && (i === 0 || messages[i - 1]?.sender === "user");

                return (
                  <MotionBox key={i}
                    initial={{ opacity: 0, y: 10, x: isUser ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ duration: 0.25 }}
                    sx={{
                      display: "flex", flexDirection: "column",
                      alignItems: isUser ? "flex-end" : "flex-start",
                      mb: 0.3
                    }}
                  >
                    {showAvatar && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.3, ml: 0.5 }}>
                        <Box sx={{
                          width: 20, height: 20, borderRadius: "6px",
                          background: "linear-gradient(135deg, #1a237e, #1565c0)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <SmartToyIcon sx={{ color: "#fff", fontSize: 12 }} />
                        </Box>
                        <Typography sx={{ fontSize: "0.65rem", color: "#90a4ae", fontWeight: 600 }}>
                          Assistant
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{
                      maxWidth: "82%", px: 1.8, py: 1.2,
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      bgcolor: isUser
                        ? "linear-gradient(135deg, #1a237e, #1565c0)"
                        : "#fff",
                      background: isUser ? "linear-gradient(135deg, #1a237e, #1565c0)" : "#fff",
                      color: isUser ? "#fff" : "#263238",
                      boxShadow: isUser ? "0 2px 12px rgba(21,101,192,0.2)" : "0 1px 4px rgba(0,0,0,0.06)",
                      border: isUser ? "none" : "1px solid #eee"
                    }}>
                      {msg.type === "categories" ? (
                        <Box>
                          <Typography sx={{ fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>
                            {msg.text}
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                            {[
                              { label: "📱 Electronics", value: "electronics" },
                              { label: "👕 Clothing", value: "clothing" },
                              { label: "📄 Documents", value: "documents" },
                              { label: "🍔 Food", value: "food" },
                              { label: "🪑 Furniture", value: "furniture" },
                              { label: "💊 Medical", value: "medical" },
                              { label: "🔧 Automotive", value: "automotive" },
                              { label: "💄 Cosmetics", value: "cosmetics" },
                              { label: "⚽ Sports", value: "sports" },
                              { label: "📚 Books", value: "books" },
                              { label: "⚠️ Fragile", value: "fragile" },
                              { label: "🏭 Industrial", value: "industrial" },
                            ].map((cat) => (
                              <Box key={cat.value} onClick={() => handleQuickAction(`show ${cat.value} parcels`)}
                                sx={{
                                  px: 1.2, py: 0.5, borderRadius: "12px", cursor: "pointer",
                                  border: "1px solid #c5cae9", fontSize: "0.73rem",
                                  fontWeight: 600, color: "#1a237e", bgcolor: "#f5f7ff",
                                  transition: "all 0.2s",
                                  "&:hover": { bgcolor: "#e8eaf6", borderColor: "#1a237e", transform: "scale(1.03)" }
                                }}
                              >
                                {cat.label}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Typography sx={{ whiteSpace: "pre-line", fontSize: "0.85rem", lineHeight: 1.5, wordBreak: "break-word" }}>
                          {msg.text}
                        </Typography>
                      )}
                    </Box>
                    <Typography sx={{
                      fontSize: "0.6rem", color: "#bdbdbd", mt: 0.2,
                      mx: 1, fontWeight: 500
                    }}>
                      {formatTime(msg.time)}
                    </Typography>
                  </MotionBox>
                );
              })}

              {/* Typing Indicator */}
              {botTyping && (
                <MotionBox
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  sx={{ display: "flex", alignItems: "flex-start" }}
                >
                  <Box sx={{
                    bgcolor: "#fff", borderRadius: "16px 16px 16px 4px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #eee"
                  }}>
                    <TypingDots />
                  </Box>
                </MotionBox>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Actions */}
            {mode === "NORMAL" && !botTyping && (
              <Box sx={{
                px: 2, py: 1, bgcolor: "#f8f9fc", borderTop: "1px solid #f0f0f0",
                display: "flex", gap: 0.8, overflowX: "auto",
                "&::-webkit-scrollbar": { display: "none" }
              }}>
                <QuickAction label="📦 My Parcels" onClick={() => showCategoryPicker()} />
                <QuickAction label="🚚 Track Parcel" onClick={() => handleQuickAction("track my parcel")} />
                <QuickAction label="📄 Latest Parcel" onClick={() => handleQuickAction("show my latest parcel")} />
                <QuickAction label="⏰ Delayed" onClick={() => handleQuickAction("show delayed parcels")} />
              </Box>
            )}

            {/* Input Area */}
            <Box sx={{
              px: 2, py: 1.5, bgcolor: "#fff",
              borderTop: "1px solid #f0f0f0",
              display: "flex", alignItems: "center", gap: 1
            }}>
              <TextField
                inputRef={inputRef}
                fullWidth size="small"
                placeholder={loading ? "Thinking..." : "Type a message..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={loading}
                autoComplete="off"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px", bgcolor: "#f5f7fa",
                    fontSize: "0.85rem",
                    "& fieldset": { border: "1px solid #e8eaf6" },
                    "&:hover fieldset": { borderColor: "#c5cae9" },
                    "&.Mui-focused fieldset": { borderColor: "#1565c0", borderWidth: 1.5 }
                  }
                }}
              />
              <IconButton onClick={sendMessage} disabled={loading || !input.trim()}
                sx={{
                  width: 40, height: 40, borderRadius: "12px",
                  background: input.trim() ? "linear-gradient(135deg, #1a237e, #1565c0)" : "#e0e0e0",
                  color: "#fff",
                  transition: "all 0.3s",
                  "&:hover": { background: input.trim() ? "linear-gradient(135deg, #0d1b6e, #0d47a1)" : "#e0e0e0" },
                  "&:disabled": { color: "#bdbdbd", background: "#f0f0f0" }
                }}
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotPopup;
