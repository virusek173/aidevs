import { Whisper } from "../../common/whisper.js";
import { OpenAi } from "../../common/openai.js";
import axios from "axios";
import dotenv from "dotenv";
import * as fs from "fs";

const mapsPath = "./src/tasks/S02E02/images";

const main = async () => {
  const openai = new OpenAi();
  const userPrompt = `You are an expert in identifying Polish cities based on partial map fragments.  
Please examine the map closely and with great attention to detail. 
Consider not only the street names but also the overall map layout and other distinguishing features.  
What is the name of this city? Notice that there are granaries and fortresses in the city we are looking for.
Before providing your answer, 
carefully reflect on your reasoning process and encapsulate your thoughts within <thought> tags.
 Present your final answer within <answer> tags.`;

  const mapNumbers = [...Array(4).keys()];
  let responses = "";

  await Promise.all(
    mapNumbers.map(async (index: number) => {
      const response = await openai.visionInteract(
        userPrompt,
        `${mapsPath}/map${index + 1}.jpg`
      );
      responses += `map${index} City: ${response}`;
      console.log(`map${index} City: ${response}`);
    })
  );

  const responseSummary = await openai.interact(
    `Summary what the answers are: ${responses} respond with format mapx: City`
  );

  console.log(`\n\nFINAL RESPONSE:\n${responseSummary}`);
};

main();
