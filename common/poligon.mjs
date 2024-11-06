import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { SECRET_KEY } = process.env;
const URL = "https://poligon.aidevs.pl/verify";
const URL_DATA = "https://poligon.aidevs.pl/dane.txt";

export class Poligon {
  constructor(taskId) {
    this.taskId = taskId;
    this.data = {
      task: "1234",
      apikey: "Twój klucz API",
      answer: "[0,1,2,3,4]",
    };
  }

  async get() {
    const response = await axios.get(URL_DATA);

    return response.data;
  }

  async verify(answer) {
    try {
      const response = await axios.post(URL, {
        task: this.taskId,
        apikey: SECRET_KEY,
        answer,
      });

      return response.data;
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
