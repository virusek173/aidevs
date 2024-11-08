import { OpenAi } from "./common/openai.js";
import { Poligon } from "./common/poligon.js";

interface PoligonResponse {
  code: number;
  msg: string;
  note?: string;
}

const createPrompt = (data: string): string => {
  return `Split this string for me to two separate entries in array in js. 
    Respond only with this array. give me only arary like: 
    ["string1", "string2"] and nothing more. The entries: ${data}`;
};

const main = async (): Promise<void> => {
  try {
    const openAi = new OpenAi("You are a helpful assistant");
    const poligon = new Poligon("POLIGON");

    const data = await poligon.get();
    const response = await openAi.interact(createPrompt(data));

    if (!response) {
      throw new Error("Failed to get response from OpenAI");
    }

    console.log("OpenAI response:", response);

    const parsedResponse = JSON.parse(response) as string[];
    const poligonResponse = await poligon.verify(parsedResponse) as PoligonResponse;

    console.log("Poligon response:", poligonResponse);
  } catch (error) {
    console.error("Error in main:", (error as Error).message);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});