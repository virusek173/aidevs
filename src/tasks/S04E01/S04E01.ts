import { last } from "underscore";
import { Central } from "../../common/central.js";
import { OpenAi } from "../../common/openai.js";

const central = new Central("photos");
const openai = new OpenAi();

const urlFactory = (fileName: string) =>
  `https://centrala.ag3nts.org/dane/barbara/${fileName}`;

const imageNameFactory = async (message: string) => {
  const openaiAnswerObject = await openai.interact(
    `Na podstawie poniższej wiadomości podaj nazwy zdjęć z pozszerzeniem .PNG.
    Podaj je w postaci listy oddzieonej przecinkiem - , bez spacji.
    Wiadomość: ${message}`
  );

  return JSON.parse(openaiAnswerObject ?? "").answer.split(",");
};

const main = async () => {
  const answer = await central.verify("START");
  const message = answer.message;

  const imageURLs = await imageNameFactory(message);

  console.log({ answer, message, imageURLs });

  const imageDescriptions = await Promise.all(
    imageURLs.map(async (fileName: string) => {
      const fileUrl = urlFactory(fileName);
      const mainVisionResponse = await openai.visionInteract(
        `Obraz może być w pewien sposób uszkodzony. 
        Masz dostępne trzy narzędzia REPAIR, DARKEN i BRIGHTEN.
        Narzędzia mogą pomóc w ulepeszeniu zdjęcia, żeby ułatwić jego czytanie. 
        REPAIR - naprawa zdjęcia zawierającego szumy/glitche.
        BRIGHTEN - rozjaśnienie fotografii.
        DARKEN - przyciemnienie fotografii.
        Zdecyduj, którego narzedzia użyć, żeby poprawić czytelność zdjęcia.
        Wpolu answer odpowiedz tylko narzedziem.
        Jeśli uważasz, że nie trzeba poprawiać obrazka, odpwoiedz NONE`,
        fileUrl
      );
      const tool = JSON.parse(mainVisionResponse ?? "").answer;
      let newFileUrl = fileUrl;
      console.log({
        mainVisionResponse,
        tool,
      });

      if (tool !== "NONE") {
        const answer = await central.verify(`${tool} ${fileName}`);
        const message = answer.message;
        if (!message.includes("źle")) {
          const newImageNames = await imageNameFactory(message);
          newFileUrl = urlFactory(newImageNames[0]);
          console.log({
            fileUrl,
            message,
          });
        }
      }

      const openaiRecognitionResponse = await openai.visionInteract(
        `Opisz kobietę, która jest na obrazku.
           Zwróć uwagę na wszystkie szczegóły,
           żeby byś w stanie zrobić na ich podstawie rysopis.`,
        newFileUrl
      );

      const descJSON = JSON.parse(openaiRecognitionResponse ?? "").answer;

      console.log({
        newFileUrl,
        openaiRecognitionResponse,
        descJSON,
      });

      return descJSON;
    })
  );

  const finalAnswerObject =
    await openai.interact(`Na podstawie opisów, stwórz jeden opis osoby, który posłóży jako rysopis. 
    OPISY: ${imageDescriptions.join(", ")}`);

  const finalAnswer = JSON.parse(finalAnswerObject ?? "").answer;
  const finalResponse = await central.verify(finalAnswer);
  console.log({ finalResponse });
};

main();
