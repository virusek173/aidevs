import axios from "axios";
import { Rafal } from "../../common/rafal.js";
import { OpenAi } from "../../common/openai.js";

const rafal = new Rafal();
const openai = new OpenAi(`W danych dostniesz polecenie jak odpowiedzieć na pytanie(pole task) oraz pytania(pole data).
    Jeżeli w polu data jest podane źródło danych, jako link to odpowiedz tylko tym linkiem niczym więcej,
    zwróć odpowiedzi na pytania w postaci tekstów po przecinku. np. "odpowiedz1, odpowiedz2, odpowiedz3"`);

const password = 'NONOMNISMORIAR';

const main = async () => {
    const sign = await rafal.get({ password });
    console.log({ sign });
    const response = await rafal.get({ sign });
    const { signature, timestamp, challenges } = response;
    console.log({ signature, timestamp, challenges });
    let finalAnswer = ''
    await Promise.all(challenges.map(async (challenge: any) => {
        const siteContentResponse = await axios.get(challenge);
        const jsonSiteContent = siteContentResponse.data;
        let siteContent = JSON.stringify(siteContentResponse.data);
        let openAiResponse = ''
        let externalUrl = null
        do {
            if (externalUrl) {
                const siteContentResponse = await axios.get(externalUrl);
                const newJsonSiteContent = { ...jsonSiteContent, task: siteContentResponse.data }
                console.log({ newJsonSiteContent });

                siteContent = JSON.stringify(newJsonSiteContent)
                externalUrl = null;
            }
            openAiResponse = await openai.interact(siteContent, "gpt-4o-mini", false) || ''
            console.log({ openAiResponse });
            if (openAiResponse.startsWith('https://')) {
                externalUrl = openAiResponse;
            }
        } while (openAiResponse.startsWith('https://'))

        console.log('Mam odpowiedzi:', openAiResponse);

        finalAnswer += `${openAiResponse}, `;
    }));

    const finalResponse = await rafal.verify(signature, timestamp, finalAnswer);
    console.log({ finalAnswer });
    console.log({ finalResponse });
};

main();
