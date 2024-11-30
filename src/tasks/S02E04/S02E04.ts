import * as fs from "fs";
import * as _ from "underscore";
import { OpenAi } from "../../common/openai.js";
import { Whisper } from "../../common/whisper.js";
import { Central } from "../../common/central.js";

const DATA_DIR = "./src/tasks/S02E04/data";

const openai = new OpenAi();
const whisper = new Whisper();

// const checkFileExistance = (path: string) => {
//     const fileExists = fs.existsSync(path);
//     const isEmpty = fileExists ? fs.statSync(path).size === 0 : true;

//     if (fileExists && !isEmpty) {
//         const transcriptionStream = fs.createReadStream(path);
//         transcriptionsContext = await streamToString(transcriptionStream);
//     }
// }

const handleFileType = {
  mp3: (path: string): Promise<string | null> => whisper.transcript(path),
  txt: (path: string): string => openai.getFileTxt(path),
  png: (path: string): Promise<string | null> =>
    openai.visionInteract("Describe what is on the image", path),
};

const main = async () => {
  const fileNames = await fs.readdirSync(DATA_DIR);
  console.log({ fileNames });

  const files = await Promise.all(
    fileNames.map(async (fileName) => {
      const type = _.last(fileName.split("."));
      const filePath = `${DATA_DIR}/${fileName}`;
      const data = await handleFileType[type as keyof typeof handleFileType](
        filePath
      );

      return { data, fileName };
    })
  );

  console.log({ files });

  const openaiCategorizer = new OpenAi(`**Prompt for Text Categorization:**

Please categorize the provided text using one of the following categories: "machines," "people," or "other."

### Guidelines for Assigning Categories:

1. **Machines**: 
   - Choose this category if the text specifically mentions fixed hardware faults or issues related to the malfunctioning or repair of machines. 

2. **People**: 
   - Select this category if the text includes:
     - Information about people being captured by robots or the potential for such capture.
     - Indications of danger to people, such as mentions of threats or evidence of harm.
     - Traces of human presence suggesting non-normal scenarios (e.g., deserted areas with signs of previous human activity).
   - **Do not** select this category if the text merely describes people normal life or describe something about people.

3. **Other**: 
   - Choose this category for all other scenarios that do not clearly fit into "machines" or "people." 
   - Use this category if there is any uncertainty in categorization or when the text includes names and surnames without context that fits the "people" category as defined above.

### Important Notes:
- Ensure that only **one** category is assigned per text.
- Use "other" if there is any doubt or it does not distinctly belong to "machines" or "people."

### _Thoughts Field:
Before making your final decision, document your reasoning in the _thoughts field to ensure clarity and consistency 
in the categorization process. This should include your reasoning behind choosing a specific category and any considerations regarding the presence of people or machines in the text.
    `);

  const categories = await Promise.all(
    files.map(async (file) => {
      const { data, fileName } = file;

      const response =
        (await openaiCategorizer.interact(
          `Assign a category to this prompt: ${data}`
        )) || "{}";
      const category = JSON.parse(response)?.answer;

      console.log({ fileName, category, response });

      return { fileName, category };
    })
  );

  const finalObject = {
    people: categories
      .filter((cat) => cat.category === "people")
      .map((i) => i.fileName)
      .sort(),
    hardware: categories
      .filter((cat) => cat.category === "machines")
      .map((i) => i.fileName)
      .sort(),
  };

  console.log({ finalObject });

  const central = new Central("kategorie");
  const finalResponse = await central.verify(finalObject);

  console.log({ finalResponse: finalResponse.data });
};

main();
