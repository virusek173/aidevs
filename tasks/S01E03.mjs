import axios from "axios";
import { OpenAi } from "../common/openai.mjs";
import dotenv from "dotenv";
import { Ollama } from "../common/ollama.mjs";

dotenv.config();
const { URL_CENTRAL, SECRET_KEY } = process.env;
const SECRRET_FILE_URL = `${URL_CENTRAL}/data/${SECRET_KEY}/json.txt`;

const main = async () => {
  try {
    const ollama = new Ollama(
      "Return with one number or word. Do not add additional text."
    );
    const response = await axios.get(SECRRET_FILE_URL);
    const testData = response.data["test-data"];

    let finalTestData = [];
    let index = 0;
    for (const obj of testData) {
      const { question, answer } = obj;
      const rightAnswer = eval(question);
      let rightA = null;

      if (obj?.test) {
        const { q, a } = obj.test;
        rightA = await ollama.interact(q);
      }

      finalTestData.push({
        question,
        answer: rightAnswer,
        ...(rightA ? { test: { q: obj?.test?.q, a: rightA } } : null),
      });
      console.log(`Progress: ${index}/${testData.length}`);
      index++;
    }

    const finalData = {
      task: "JSON",
      apikey: SECRET_KEY,
      answer: {
        ...response.data,
        apikey: SECRET_KEY,
        "test-data": finalTestData,
      },
    };

    const finalResponse = await axios.post(`${URL_CENTRAL}/report`, finalData);
    console.log("final response: ", finalResponse.data);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

main();
