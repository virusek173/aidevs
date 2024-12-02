import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { SECRET_KEY, URL_CENTRAL } = process.env;
if (!URL_CENTRAL)
  throw new Error("URL_CENTRAL environment variable is not set");
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

export class PeopleInfoService {
  async query(
    query: string | null | object,
    kind: "people" | "places"
  ): Promise<any> {
    try {
      const payload = {
        apikey: SECRET_KEY,
        query,
      };
      console.log({ adres: `${URL_CENTRAL}/${kind}`, payload });

      const response = await axios.post(`${URL_CENTRAL}/${kind}`, payload);

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
