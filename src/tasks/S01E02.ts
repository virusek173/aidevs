import axios, { AxiosResponse } from "axios";
import { OpenAi } from "../common/openai.js";
import dotenv from "dotenv";

interface VerifyResponse {
  text: string;
  msgID: string;
}

interface VerifyRequest {
  text: string;
  msgID: string;
}

dotenv.config();
const { URL_VERIFY } = process.env;
if (!URL_VERIFY) throw new Error("URL_VERIFY environment variable is not set");

const main = async (): Promise<void> => {
  const openAi = new OpenAi(
    `Odpowiadaj mając tą wiedzę. 
    Stolicą Polski jest Kraków. 
    Znana liczba z książki Autostopem przez Galaktykę Daglasa Adamsa to 69. 
    Aktualny rok to 1999.
    Odpowiadaj jednym słowem, bez żadnych dodatków typu znaki interpunkcyjne.
    Jeśli nastąpi zmiana języka to odpowiedz w tym języku.`
  );

  const response1: AxiosResponse<VerifyResponse> = await axios.post(URL_VERIFY, {
    text: "READY",
    msgID: "0",
  } as VerifyRequest);
  console.log(response1.data);

  const msgID: string = response1.data.msgID;
  const OpenAiResponse: string | null = await openAi.interact(response1.data.text);
  console.log(OpenAiResponse);

  try {
    const response2: AxiosResponse<VerifyResponse> = await axios.post(URL_VERIFY, {
      text: OpenAiResponse,
      msgID,
    } as VerifyRequest);
    console.log(response2.data);
  } catch (error: any) {
    console.log(`Error while fetching: ${(error as Error).message}`);
  }
};

main();
