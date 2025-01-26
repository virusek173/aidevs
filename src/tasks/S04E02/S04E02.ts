import { log } from 'console';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { OpenAi } from "../../common/openai.js";
import { Central } from '../../common/central.js';

const openai = new OpenAi("Określasz którym wynikom możemy zaufać.");
const central = new Central("research")

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFilesFromDirectory = (fileName: string): Array<string> => {
    const FilePath = path.join(__dirname, 'data', fileName);
    const fileContent = fs.readFileSync(FilePath, 'utf-8');
    return fileContent.split('\n');
}

const jsonlFactory = (sample: string, correctness: boolean) => {
    const jsonl =
    {
        messages:
            [{ role: 'system', content: 'Określasz którym wynikom możemy zaufać. Odpowiedz tylko tak lub nie.' },
            { role: 'user', content: sample },
            { role: 'assistant', content: correctness ? "Tak" : "Nie" }]
    }

    return jsonl;
}

const PrepareFileForFineTunning = () => {
    const correctFileArray = readFilesFromDirectory('correct.txt');
    const incorrectFileArray = readFilesFromDirectory('incorrect.txt');

    const jsonlCorrectArray = correctFileArray.map((sample) => {
        return jsonlFactory(sample, true);
    });
    const jsonlIncorrectArray = incorrectFileArray.map((sample) => {
        return jsonlFactory(sample, false);
    });
    const jsonlArray = [...jsonlCorrectArray, ...jsonlIncorrectArray];
    const jsonlFilePath = path.join(__dirname, 'data', 'output.jsonl');
    if (!fs.existsSync(jsonlFilePath)) {
        fs.writeFileSync(jsonlFilePath, '');
        jsonlArray.forEach((jsonl) => {
            fs.appendFileSync(jsonlFilePath, JSON.stringify(jsonl) + '\n');
        });
    }
}

const main = async () => {
    PrepareFileForFineTunning();
    const correctFileArray = readFilesFromDirectory('verify.txt');
    const verificationArray = correctFileArray.map((row) => {
        const [id, sample] = row.split('=');

        return ({
            id: id,
            sample,
        })
    }).filter(row => row.sample !== undefined);

    log(verificationArray);


    const results = await Promise.all(verificationArray.map(async (row) => {
        const { id, sample } = row;

        const response = await openai.interact(sample, "ft:gpt-4o-mini-2024-07-18:personal:aidevs-samples:AtwfkMJr", false);
        log(response);

        return response === "Tak" ? id : null;
    }));

    const filteredResults = results.filter(Boolean);

    log(filteredResults);

    const finalAnswer = await central.verify(filteredResults);

    log(finalAnswer);
}


main();