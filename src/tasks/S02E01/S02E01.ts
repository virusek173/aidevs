import { Whisper } from "../../common/whisper.js";
import { OpenAi } from "../../common/openai.js";
import axios from "axios";
import dotenv from "dotenv";
import * as fs from "fs";

const audioPath = "./src/tasks/S02E01/audio";
const audioList = [
  "adam.m4a",
  "agnieszka.m4a",
  "ardian.m4a",
  "michal.m4a",
  "monika.m4a",
  "rafal.m4a",
];
const transcriptionFile = `./src/tasks/S02E01/transcriptions.txt`;

function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve: (value: string) => void, reject: (error: Error) => void) => {
    let data: string = '';
    stream.on('data', (chunk: Buffer | string) => {
      data += chunk.toString();
    });
    stream.on('end', () => {
      resolve(data);
    });
    stream.on('error', (error: Error) => {
      reject(error);
    });
  });
}

dotenv.config();
const { URL_CENTRAL, SECRET_KEY } = process.env;
if (!URL_CENTRAL)
  throw new Error("URL_CENTRAL environment variable is not set");
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

interface FinalData {
  task: string;
  apikey: string | undefined;
  answer: string | null;
}

const main = async () => {

  let transcriptionsContext = '';
  
  // Check if file exists and is not empty
  const fileExists = fs.existsSync(transcriptionFile);
  const isEmpty = fileExists ? fs.statSync(transcriptionFile).size === 0 : true;

  if (fileExists && !isEmpty) {
    const transcriptionStream = fs.createReadStream(transcriptionFile);
    transcriptionsContext = await streamToString(transcriptionStream);
  } else {
    const whisper = new Whisper();

    const transcriptions = await Promise.all(
      audioList.map(async (audio) => {
        return await whisper.transcript(`${audioPath}/${audio}`);
      })
    );
    transcriptionsContext = transcriptions.join(
      "\n\n ##Kolejne nagranie \n"
    );
  
    fs.writeFileSync(
      transcriptionFile,
      transcriptionsContext,
      "utf-8"
    );
  }

  const openai = new OpenAi(
    `Jesteś detektywem, który musi określić nazwę ulicy przebywania Andrzeja Maja na podstawie zeznań świadków. 
    Określ ją na podstawie wskazówek, które dostaniesz z zeznań. 
    Osoby w zeznaniach dużo konfabulują. Na pewno nie podają poprawnej nazwy ulicy wprost. 
    Ulice musisz określić z kontekstu zeznań. Przemyśl odpowiedź. Przedstaw swój tok rozumowania i podaj nazwę ulicy.
    Skorzystaj również ze swojej wiedzy, aby określić Ulicę przebywania Andrzeja Maja.`
  );
  const openAiResponse = await openai.interact(
    `Zeznania świadków: ${transcriptionsContext}`
  );

  const finalData: FinalData = {
    task: "mp3",
    apikey: SECRET_KEY,
    answer: openAiResponse,
  };

  console.log({
    transcriptionsContext,
    openAiResponse,
  });

  try {
    const finalResponse = await axios.post(`${URL_CENTRAL}/report`, finalData);

    console.log({
      transcriptionsContext,
      openAiResponse,
      finalResponse: finalResponse.data,
    });
  } catch (error: any) {
    console.log(`Error: ${error}`);
  }
};

main();
