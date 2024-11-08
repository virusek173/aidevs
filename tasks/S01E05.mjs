import axios from "axios";
import { OpenAi } from "../common/openai.mjs";
import dotenv from "dotenv";
import { Ollama, MODELS } from "../common/ollama.mjs";

dotenv.config();
const { URL_CENTRAL, SECRET_KEY } = process.env;
const SECRRET_FILE_URL = `${URL_CENTRAL}/data/${SECRET_KEY}/cenzura.txt`;

const prompt = `Zmień każde słowo, które jest imieniem, nazwiskiem, wiekiem, miastem i ulicą wraz z numerem na słowo CENZURA. 
Ulicę i numer zamień na jedno słowo CENZURA. Imię i nazwisko zamień na jedno słowo CENZURA.
Użyj tego słowa, niczego więcej. Resztę tekstu pozostaw bez zmiany. Nie usuwaj takich słów jak ul. z tekstu. Są one potrzebne.`;

const main = async () => {
  try {
    const ollama = new Ollama(prompt, MODELS.GEMMA);
    const response = await axios.get(SECRRET_FILE_URL);
    const message = response.data;

    const censoredMessage = await ollama.interact(message);

    console.log(message);
    console.log(censoredMessage);

    const finalData = {
      task: "CENZURA",
      apikey: SECRET_KEY,
      answer: censoredMessage,
    };

    const finalResponse = await axios.post(`${URL_CENTRAL}/report`, finalData);
    console.log("final response: ", finalResponse);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

main();
