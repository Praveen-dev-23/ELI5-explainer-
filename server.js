const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not set in the .env file.");
}
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

app.post('/api/simplify', async (req, res) => {
    try {
        const { text, mode } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        if (!genAI) {
            return res.status(500).json({ error: 'Server configuration error: API key missing.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        let prompt = text;
        if (mode === 'eli5' || mode === undefined) {
            prompt = `Explain this text like I'm 5 years old. Use simple analogies and friendly language:\n\n${text}`;
        }
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const explanation = response.text();
        
        res.json({ explanation });
    } catch (error) {
        console.error('Error generating explanation:', error);
        res.status(500).json({ error: 'Failed to generate explanation. Please check server logs.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
