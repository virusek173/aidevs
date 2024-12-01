import { Central } from "../../common/central.js";
import { OpenAi } from "../../common/openai.js";
import { Qdrant } from "../../common/qdrant.js";
import fs from "fs";
import path from "path";

const COLLECTION_NAME = "aidevs";

const DIRNAME = "./src/tasks/S03E02";

const openai = new OpenAi();
const qdrant = new Qdrant(openai, DIRNAME);
const cental = new Central("wektory");

async function main() {
  const points: Array<{
    id?: string;
    text: string;
    metadata?: Record<string, any>;
  }> = [];

  fs.readdirSync(`${DIRNAME}/data`).forEach((file) => {
    const filePath = path.join(`${DIRNAME}/data`, file);
    const text = fs.readFileSync(filePath, "utf-8");
    const date = file.split(".")[0];

    points.push({ text, metadata: { date } });
  });

  await qdrant.initializeCollectionWithData(COLLECTION_NAME, points);
  const query =
    "W raporcie, z którego dnia znajduje się wzmianka o kradzieży prototypu broni?";
  const searchedResults = await qdrant.search(COLLECTION_NAME, query);

  const finalResultDate = searchedResults[0]?.payload?.date ?? "";

  const result = await cental.verify(
    (finalResultDate as string).replace(/_/g, "-")
  );

  searchedResults.forEach((d) => console.log(d.payload));

  console.log({ searchedResults, result });
}

main();
