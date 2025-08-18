// server.js

// ... other require statements ...
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000; // Use environment port or 3000

// Check for the API key from environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not defined in environment variables.");
    process.exit(1);
}
// Initialize with the key from the environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ... the rest of your server.js code remains the same ...

// IMPORTANT: Make sure your listen function uses the 'port' variable
app.listen(port, () => {
    console.log(`✅ AI backend server is running successfully on port ${port}`);
});