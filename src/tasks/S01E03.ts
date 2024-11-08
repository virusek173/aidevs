import axios from "axios";
import { OpenAi } from "../common/openai.js";
import dotenv from "dotenv";
import { Ollama } from "../common/ollama.js";

dotenv.config();
const { URL_CENTRAL, SECRET_KEY } = process.env;
if (!URL_CENTRAL) throw new Error("URL_VERIFY environment variable is not set");
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

const SECRRET_FILE_URL = `${URL_CENTRAL}/data/${SECRET_KEY}/json.txt`;

interface TestItem {
  question: string;
  answer: string;
  test?: {
    q: string;
    a: string;
  };
}

interface ResponseData {
  'test-data': TestItem[];
  [key: string]: any;
}

interface FinalData {
  task: string;
  apikey: string | undefined;
  answer: ResponseData & {
    apikey: string;
  };
}

const main = async (): Promise<void> => {
  try {
    const ollama = new Ollama(
      "Return with one number or word. Do not add additional text."
    );
    const response = await axios.get<ResponseData>(SECRRET_FILE_URL);
    const testData: TestItem[] = response.data["test-data"];

    let finalTestData: TestItem[] = [];
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
        ...(rightA && obj.test ? { test: { q: obj.test.q, a: rightA } } : {})
      });
      console.log(`Progress: ${index}/${testData.length}`);
      index++;
    }

    const finalData: FinalData = {
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
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
  }
};

main();
