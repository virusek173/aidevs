import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { SECRET_KEY, URL_CENTRAL } = process.env;
if (!URL_CENTRAL)
  throw new Error("URL_CENTRAL environment variable is not set");
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

interface FinalData {
  task: string;
  apikey: string | undefined;
  answer: string | null;
}

export class Central {
  private taskId: string;

  constructor(taskId: string) {
    this.taskId = taskId;
  }

  async verify(answer: string | null): Promise<any> {
    try {
      const response = await axios.post(`${URL_CENTRAL}/report`, {
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
