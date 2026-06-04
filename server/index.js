import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import parcelRoutes from './routes/parcel.js';
// import chatbotRoutes from './routes/chatbot.js';
import deepanshuRoutes from "./routes/deepanshuchatbot.js"
import langchainRoutes from "./routes/langchainChatbot.js"
import { seedIntents } from "./scripts/seedIntents.js";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/parcel', parcelRoutes);
app.use('/api/chatbot', deepanshuRoutes);
app.use("/api/langchain_chatbot",langchainRoutes);


app.get('/', (req, res) => res.send('Parcel Tracker API'));


const PORT = process.env.PORT || 5000;

connectDB().then(async() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    await seedIntents();
}).catch(err => console.error(err));