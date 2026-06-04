import express from "express";
const router = express.Router();
import { authMiddleware } from "../middleware/auth.js";
import { jarvis } from "../controllers/chatbotController.ts";

router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const userMessage = req.body.message?.trim();
        // const sessionId = req.headers["x-chat-session"] || "default";

        let jarvisResponce = await jarvis(userId,userMessage, 1)
        const messages = jarvisResponce.messages;
        const lastAIMessage = [...messages]
            .reverse()
            .find(msg => msg.constructor.name === "AIMessage" && msg.content);
        const finalResponse = lastAIMessage?.content || "No response generated";
        res.status(200).json({ reply: finalResponse})
    } catch (error) {
        console.error("CHATBOT ERROR:", error);
        return res.status(500).json({ reply: "Something went wrong. Please try again." });
    }
})

export default router;