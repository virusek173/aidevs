import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { SECRET_KEY, URL_CENTRAL, RAFAL_URL } = process.env;
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");
if (!RAFAL_URL) throw new Error("RAFAL_URL environment variable is not set");
if (!URL_CENTRAL)
    throw new Error("URL_CENTRAL environment variable is not set");

export class Rafal {
    async get(body: Record<any, any> = {}): Promise<any> {
        try {
            const preparedBody = {
                data: { ...body }
            };
            console.log({ preparedBody });

            const response = await axios.get(`${RAFAL_URL}`, preparedBody);
            return response.data?.message;
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

    async verify(signature: string, timestamp: string, answer: string | null | object): Promise<any> {
        try {
            const payload = {
                data: {

                    apikey: SECRET_KEY,
                    signature,
                    timestamp,
                    answer,
                }
            }

            const response = await axios.get(`${RAFAL_URL}`, payload);

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
