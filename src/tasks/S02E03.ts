import axios from "axios";
import { OpenAi } from "../common/openai.js";
import dotenv from "dotenv";
import { Poligon } from "../common/poligon.js";
import { Central } from "../common/central.js";

dotenv.config();
const { URL_CENTRAL, SECRET_KEY } = process.env;
if (!URL_CENTRAL)
  throw new Error("URL_CENTRAL environment variable is not set");
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

const IMAGE_DESCRIPTION_URL = `${URL_CENTRAL}/data/${SECRET_KEY}/robotid.json`;

const main = async () => {
  const openai = new OpenAi();
  const central = new Central("robotid");

  const response = await axios.get(IMAGE_DESCRIPTION_URL);
  const imageGenerationPrompt = `Generate image based on description: ${response.data.description}`;
  console.log({ imageGenerationPrompt });

  const imageUrl = await openai.visionGnerate(imageGenerationPrompt);
  console.log({ imageUrl });

  const finalAnswer = await central.verify(imageUrl);
  console.log({ finalAnswer });
};

main();
