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

  async verify(answer: string | null | object): Promise<any> {
    try {
      const payload = {
        task: this.taskId,
        apikey: SECRET_KEY,
        answer,
      };
      console.log({ adres: `${URL_CENTRAL}/report`, payload });

      const response = await axios.post(`${URL_CENTRAL}/report`, payload);

      return response.data;
    } catch (error: any) {
      {
        if (error.response) {
          if (error.response.status === 400) {
            console.error("Bad Request Error:", error.response.data);
          } else {
            console.error(
              "Server responded with error:",
              error.response.status
            );
          }
        }
      }
    }
  }
}
