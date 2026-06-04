import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


export const connectDB = async () => {
try {
await mongoose.connect(process.env.MONGO_URI, {
// options not required for mongoose v6+
});
console.log('MongoDB connected');
} catch (err) {
console.error(err);
process.exit(1);
}
};