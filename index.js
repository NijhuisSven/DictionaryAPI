import express from "express";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const { key } = require('./key.json');
const app = express();

// Existing AI setup
const ai = new GoogleGenerativeAI(key);
const schema = {
    description: "Word definition schema",
    type: SchemaType.OBJECT,
    properties: {
        word: { type: SchemaType.STRING, nullable: false },
        phonetic: { type: SchemaType.STRING, nullable: false },
        partOfSpeech: { type: SchemaType.STRING, nullable: false },
        definition: { type: SchemaType.STRING, nullable: false },
        exampleSentence: { type: SchemaType.STRING, nullable: false },
    },
    required: ["word", "partOfSpeech", "definition", "exampleSentence"],
};

const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
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

app.get("/api/definition/en/:word", async (req, res) => {
    try {
        const inputWord = req.params.word;
        const prompt = `
            Given a single word, which we will represent as ${inputWord}, generate a JSON file containing:
            - the word
            - its phonetic
            - its part of speech
            - a definition in English
            - an example sentence in English
            UNDER NO CIRCUMSTANCES SHOULD YOU TRANSLATE ${inputWord} OR ITS DEFINITION INTO A DIFFERENT LANGUAGE.
            IF YOU ARE NOT 100% CERTAIN ABOUT THE ACCURACY, RETURN {"error": "Unable to confidently generate information for this word."}
        `;
        const response = await model.generateContent(prompt);
        res.type("json").send(response.response.text());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/definition/nl/:word", async (req, res) => {
    try {
        const inputWord = req.params.word;
        const prompt = `
            Given a single word, which we will represent as ${inputWord}, generate a JSON file containing:
            - the word
            - its phonetic
            - its part of speech
            - a definition in Dutch
            - an example sentence in Dutch
            UNDER NO CIRCUMSTANCES SHOULD YOU TRANSLATE ${inputWord} OR ITS DEFINITION INTO A DIFFERENT LANGUAGE.
            IF YOU ARE NOT 100% CERTAIN ABOUT THE ACCURACY, RETURN {"error": "Unable to confidently generate information for this word."}
        `;
        const response = await model.generateContent(prompt);
        res.type("json").send(response.response.text());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});