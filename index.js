import express from "express";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

//const { key } = require('./key.json');
const app = express();

// Existing AI setup
const ai = new GoogleGenerativeAI("");
const schema = {
    description: "Word definition schema",
    type: SchemaType.OBJECT,
    properties: {
        word: { type: SchemaType.STRING, nullable: true },
        phonetic: { type: SchemaType.STRING, nullable: true },
        partOfSpeech: { type: SchemaType.STRING, nullable: true },
        definition: { type: SchemaType.STRING, nullable: true },
        exampleSentence: { type: SchemaType.STRING, nullable: true },
        status: { type: SchemaType.INTEGER, nullable: false }
    },
    required: ["word", "partOfSpeech", "definition", "exampleSentence"],
};

const model = ai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
    },
});

// New endpoint
app.get("/api/definition/:word", async (req, res) => {
    try {
        const inputWord = req.params.word;
        const prompt = `
            Given a single word, which we will represent as ${inputWord}, generate a JSON file containing the word, the phonetic, its part of speech, a definition, and an example sentence. If ${inputWord} is an English word (like "chair"), the definition should be in English. If ${inputWord} is a Dutch word (like "tafel"), the definition should be in Dutch. UNDER NO CIRCUMSTANCES SHOULD YOU TRANSLATE ${inputWord} OR ITS DEFINITION INTO ENGLISH. The JSON file should only contain information for the single ${inputWord}, and the language used for the definition must accurately reflect the language of the input word. IF YOU ARE NOT 100% CERTAIN ABOUT THE ACCURACY OF ANY OF THE GENERATED INFORMATION (phonetic, part of speech, definition, or example sentence), RETURN THE FOLLOWING JSON ERROR MESSAGE INSTEAD OF GENERATING THE WORD DATA: {"error": "Unable to confidently generate information for this word."}
        `;
        const response = await model.generateContent(prompt);
        res.type("json").send(response.response.text());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/definition/:lang/:word", async (req, res) => {
    try {
        const start = Date.now();
        const inputLang = req.params.lang.toUpperCase();
        const inputWord = req.params.word;
        const prompt = `
            
            This prompt is written in English, this should not affect your ability to respond in a different language, please follow every language-related instruction that is given within the prompt.
            You should respond in the language originating from the country of this specific country-code: "${inputLang}". 

            The given word is: "${inputWord}", please respond with these criteria:
            - The word itself, in the language originating from the country of this specific country-code: "${inputLang}".
            - It's phonetic, in the language originating from the country of this specific country-code: "${inputLang}". 
            - It's part of speech, in the language originating from the country of this specific country-code: "${inputLang}". 
            - A definition, in the language originating from the country of this specific country-code: "${inputLang}". 
            - And an example sentence, in the language originating from the country of this specific country-code: "${inputLang}". 

            Be sure to respond in the language most-spoken in or originating from the country of this specific country-code: "${inputLang}".
            At last, respond in the object: "status" with either a 0 or 1, which indicates if the request was successful. If you were not able to find a word, respond with 0, if you did find a word then respond with 1.
        `;
        const response = await model.generateContent(prompt);
        const end = Date.now(); // Record end time
        const responseTime = end - start; // Calculate response time in milliseconds

        console.log(`Response time for /api/definition/${inputLang}/${inputWord}: ${responseTime} ms`); 
        res.type("json").send(response.response.text());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});