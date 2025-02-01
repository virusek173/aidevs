import axios from "axios";
import { log } from "console";
import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";
import * as path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';
import { OpenAi } from "../../common/openai.js";
import dotenv from "dotenv";
import { Central } from "../../common/central.js";
import { ImageAnnotatorClient } from '@google-cloud/vision';

dotenv.config();
const { SECRET_KEY } = process.env;
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_NAME = "notatnik-rafala.pdf";
const PDF_PATH = path.join(__dirname, 'data', PDF_NAME);
const GC_KEY_PATH = path.join(__dirname, 'aidevsocr.json');
const gCClient = new ImageAnnotatorClient({
    keyFilename: GC_KEY_PATH
});
const openai = new OpenAi('Popraw tekst na bardzoej zrozumiały dla modelu językowego. Nie zmieniaj jego treści');
const openaiDecider = new OpenAi(`Czytasz notes z zapiskami rafała. 
    Odpowiedz krótko zwięźle i na temat na pytanie.
    Zastanów się nad odpowiedzią, zanim ją podasz.
    niektóre notatki mogą nie mieć sensu, dlatego zmodyfikuj je przed podzaniem odpowiedzi na podstawie kontekstu.
    Bardzo dokładnie przemyśl odpowiedź na podstawie podanych wydarzeń, zanim ją podasz.
    Odpowiedź na pytanie uwzględniając wszystkie fakty podane w notatkach, w szczególności odwołania do wydarzeń.
    Podaj odpowiedź na pytanie na podstawie treści notatek oraz wydarzeń opisanych.
    Jak podajesz odpowiedź np. miejsce to zastanów się można by je zmodyfikoawć, żeby miało sens.
    jeśli podajesz odpowiedź, przemyśl ją na podstawie całego kontekstu.
    w tekście może być informacja o mieście koło innego miasta, ale koło może być innym słowem, źle odczytanym.
    `);

const central = new Central('notes');

const pdfToImages = async () => {
    let counter = 1;
    const document = await pdf(PDF_PATH, { scale: 3 });
    for await (const image of document) {
        const filePath = path.join(__dirname, 'data', `page${counter}.png`);
        await fs.writeFile(filePath, image);
        counter++;
    }
}

const getPdf = async () => {
    const response = await axios.get(("https://centrala.ag3nts.org/dane/notatnik-rafala.pdf"), {
        responseType: 'arraybuffer',
    });
    // Write the pdf data to a file
    await fs.writeFile(PDF_PATH, response.data);
}

const ocrImage = async (imagePath: string) => {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'pol', {
        logger: m => console.log('Tesseract:', m),
    });
    return text;
}

async function performGoogleOcr(imagePath: string) {
    try {
        // Perform text detection
        const [result] = await gCClient.textDetection(imagePath);
        const detections = result.textAnnotations;
        console.log('Detected text:');
        console.log(detections?.[0].description);
        return detections?.[0].description || '';
    } catch (error) {
        console.error('An error occurred:', error);
        return '';
    }
}

const extractTextFromImages = async () => {
    const texts = [];
    const imageDir = path.join(__dirname, 'data');
    const files = await fs.readdir(imageDir);
    const imageFiles = files.filter(file => file.endsWith('.png'));

    for (const file of imageFiles) {
        const filePath = path.join(imageDir, file);
        // Tessearct OCR
        // const text = await ocrImage(filePath);
        const text = await performGoogleOcr(filePath);
        texts.push(text);
    }

    return texts;
}

const saveTextsToFile = async (texts: string[]) => {
    const outputFilePath = path.join(__dirname, 'data', 'google_raw_texts.txt');
    const data = texts.join('\n\n');
    await fs.writeFile(outputFilePath, data, 'utf8');
}

const improveRawTexts = async () => {
    const rawTextFilePath = path.join(__dirname, 'data', 'google_raw_texts.txt');
    const rawText = await fs.readFile(rawTextFilePath, 'utf8');
    const chunks = rawText.split('\n\n');
    console.log(chunks.length);
    let text = '';
    await Promise.all(chunks.map(async (chunk) => {
        const response = await openai.interact(chunk, "gpt-4o");
        const answer = response && JSON.parse(response).answer;
        if (answer) {
            text += answer + '\n\n';
        }
        console.log(response);
    }));

    const outputFilePath = path.join(__dirname, 'data', `google_raw_texts.txt`);
    await fs.writeFile(outputFilePath, text, 'utf8');
}

const getQuestions = async () => {
    const response = await axios.get(`https://centrala.ag3nts.org/data/${SECRET_KEY}/notes.json`);
    return response.data;
}

const getOpenaiAnswer = async (question: string, messageContent: string, excludeEntries: string[]) => {
    const prompt = `Pytanie: ${question} Nie podawaj odpowiedzi, bo sią nieprawidłowe: ${excludeEntries.join(', ')} Treść wiadomości: ${messageContent}}`;
    const response = await openaiDecider.interact(prompt, "gpt-4o", true);
    log('Odpowiedź z openai: ', response);
    const responseJSON = response && JSON.parse(response);
    return responseJSON?.answer;
}


const main = async () => {
    // await getPdf();
    // await pdfToImages();

    // Use OCR to get text from images.
    // const texts = await extractTextFromImages();
    // console.log(texts);
    // await saveTextsToFile(texts);

    // Improve raw texts using OpenAI.
    // await improveRawTexts();

    const questions: { [key: string]: string } = await getQuestions();
    const exclude: { [key: string]: string[] } = {
        '01': ['2020', '2022', '2023', '2024', '2025', '2026', '2027', '2238'],
        '02': [],
        '03': ['las', 'lesie', 'Grudziądz'],
        '04': ['2024-11-04', '2024-11-05', '2024-11-06', '2024-11-11', '2024-11-15', '2024-12-14'],
        '05': ['Lupany Kov Grudziny', 'Grudziądz', 'Lupany Kowal Grudziny', 'Lupany Kovo Grudziny']
    };
    console.log(questions);
    const TextFilePath = path.join(__dirname, 'data', 'google_raw_texts.txt');
    const text = await fs.readFile(TextFilePath, 'utf8');
    const chunks = text.split('\n\n');

    let finalAnswer: { [key: string]: string } = { '01': '', '02': '', '03': '', '04': '', '05': '' };

    await Promise.all(Object.entries({ '05': questions['05'] }).map(async ([key, question]) => {
        console.log(`Question ${key}: ${question}`);
        const excludeEntries = exclude[key];
        for (const chunk of chunks) {
            let answer = 'nie';
            do {
                answer = await getOpenaiAnswer(question, chunk, excludeEntries);
                log('Brak, odpowiedzi, szukam dalej');
            } while (answer?.toLowerCase()?.startsWith('nie') || excludeEntries.some((e => answer.includes(e))));
            log('Odpowiedź na pytanie: ', { question, answer });
            const parsedAnswer = answer.replace('Answer: ', '');
            finalAnswer[key] = parsedAnswer;
        }
    }));

    // const response = await central.verify(finalAnswer);
    // log('Odpowiedź z centrali: ', response);
    log('Odpowiedzi na pytania: ', questions);
    log('Odpowiedzi na pytania: ', finalAnswer);
}

main();