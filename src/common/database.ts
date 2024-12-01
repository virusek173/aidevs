import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { SECRET_KEY, DB_URL } = process.env;
if (!DB_URL) throw new Error("DB_URL environment variable is not set");
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

export class DatabaseService {
  private taskId: string;

  constructor(taskId: string) {
    this.taskId = taskId;
  }

  async execute(query: string | null | object): Promise<any> {
    try {
      const payload = {
        task: this.taskId,
        apikey: SECRET_KEY,
        query,
      };
      console.log({ adres: `${DB_URL}`, payload });

      const response = await axios.post(`${DB_URL}`, payload);

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
