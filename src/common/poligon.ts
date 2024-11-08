import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { SECRET_KEY } = process.env;
const URL: string = "https://poligon.aidevs.pl/verify";
const URL_DATA: string = "https://poligon.aidevs.pl/dane.txt";

interface VerifyData {
  task: string;
  apikey: string;
  answer: string | object;
}

export class Poligon {
  private taskId: string;
  private data: VerifyData;

  constructor(taskId: string) {
    this.taskId = taskId;
    this.data = {
      task: "1234",
      apikey: "Twój klucz API",
      answer: "[0,1,2,3,4]",
    };
  }

  async get(): Promise<string> {
    const response = await axios.get<string>(URL_DATA);
    return response.data;
  }

  async verify(answer: string | object): Promise<any> {
    try {
      const response = await axios.post(URL, {
        task: this.taskId,
        apikey: SECRET_KEY,
        answer,
      });

      return response.data;
    } catch (error) {
      console.error("Error:", (error as Error).message);
      return undefined;
    }
  }
}
