import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
import { Ollama, MODELS } from "../common/ollama.js";

dotenv.config();
const { URL_CENTRAL, SECRET_KEY } = process.env;
if (!URL_CENTRAL) throw new Error("URL_VERIFY environment variable is not set");
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

const SECRRET_FILE_URL = `${URL_CENTRAL}/data/${SECRET_KEY}/cenzura.txt`;

const prompt = `Zmień każde słowo, które jest imieniem, nazwiskiem, wiekiem, miastem i ulicą wraz z numerem na słowo CENZURA. 
Ulicę i numer zamień na jedno słowo CENZURA. Imię i nazwisko zamień na jedno słowo CENZURA.
Użyj tego słowa, niczego więcej. Resztę tekstu pozostaw bez zmiany. Nie usuwaj takich słów jak ul. z tekstu. Są one potrzebne.`;

interface FinalData {
  task: string;
  apikey: string;
  answer: string;
}

const main = async (): Promise<void> => {
  try {
    const ollama = new Ollama(prompt, MODELS.GEMMA);
    const response = await axios.get(SECRRET_FILE_URL);
    const message: string = response.data;

    const censoredMessage: string | null = await ollama.interact(message);

    console.log(message);
    console.log(censoredMessage);

    if (censoredMessage) {
      const finalData: FinalData = {
        task: "CENZURA",
        apikey: SECRET_KEY,
        answer: censoredMessage,
      };
  
      const finalResponse = await axios.post(`${URL_CENTRAL}/report`, finalData);
      console.log("final response: ", finalResponse);
    }
  } catch (error: any) {
    console.log(`Error: ${(error as Error).message}`);
  }
};

main();
