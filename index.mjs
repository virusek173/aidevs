import { OpenAi } from "./common/openai.mjs";
import { Poligon } from "./common/poligon.mjs";

const main = async () => {
  const openAi = new OpenAi();
  // const response = await openAi.interact("Where are you?");

  const poligon = new Poligon("POLIGON");
  const data = await poligon.get();
  const response = await openAi.interact(
    `Split this string for me to two separate entries in array in js. 
    Respond only with this array. give me only arary like: 
    ["string1", "string2"] and nothing more. The entries: ` + data
  );
  console.log("openai resp: ", response);
  const poligonResponse = await poligon.verify(JSON.parse(response));
  console.log("poligon resp: ", poligonResponse);
};

main();
