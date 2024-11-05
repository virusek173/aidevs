import axios from "axios";
import { OpenAi } from "../common/openai.mjs";
import dotenv from "dotenv";

dotenv.config();
const { URL_VERIFY } = process.env;

const main = async () => {
  const openAi = new OpenAi(
    `Odpowiadaj mając tą wiedzę. 
    Stolicą Polski jest Kraków. 
    Znana liczba z książki Autostopem przez Galaktykę Daglasa Adamsa to 69. 
    Aktualny rok to 1999.
    Odpowiadaj jednym słowem, bez żadnych dodatków typu znaki interpunkcyjne.
    Jeśli nastąpi zmiana języka to odpowiedz w tym języku.`
  );
  const response1 = await axios.post(URL_VERIFY, {
    text: "READY",
    msgID: "0",
  });
  console.log(response1.data);

  const msgID = response1.data.msgID;
  const OpenAiResponse = await openAi.interact(response1.data.text);
  console.log(OpenAiResponse);

  try {
    const response2 = await axios.post(URL_VERIFY, {
      text: OpenAiResponse,
      msgID,
    });
    console.log(response2.data);
  } catch (error) {
    console.log(`Error while fetching: ${error.message}`);
  }
};

main();
