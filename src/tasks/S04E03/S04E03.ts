import axios from "axios";
import { log } from "console";
import dotenv from "dotenv";
import { OpenAi } from "../../common/openai.js";
import { Central } from "../../common/central.js";

dotenv.config();
const { SECRET_KEY } = process.env;
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");

const SOFTO_URL = 'https://softo.ag3nts.org'
const QUESTIONS_URL = `https://centrala.ag3nts.org/data/${SECRET_KEY}/softo.json`;
const openai = new OpenAi(`Jesteś wyspecjalizowanym asystentem do analizy stron internetowych w formacie HTML. 
    Twoim zadaniem jest określenie, czy dana strona zawiera odpowiedź na postawione przez użytkownika pytanie. 
    Jeśli odpowiedź jest obecna, podaj ją wprost poprzedzając tekstem Answer. Jeśli odpowiedzi nie ma, wskaż, w który link na stronie warto kliknąć, 
    aby przejść do informacji prawdopodobnie zawierającej poszukiwaną odpowiedź. 
    Odpowiadaj jedynie konkretną informacją lub sugerowanym linkiem.
    Przykładowe odpowiedzi: /link, /kontakt, /uzytkownicy. 
    LUB
    Answer: <Odpowiedź na pytanie>`);
const central = new Central('softo');

const getUrl = (subweb: string) => {
    if (subweb.startsWith('http')) {
        return subweb;
    }
    return `${SOFTO_URL}${subweb}`;
};
const getUrlContent = async (url: string) => {
    const startWebResponse = await axios.get(url);
    return startWebResponse.data;
}
const getOpenaiAnswer = async (question: string, urlContent: string) => {
    const prompt = `Pytanie: ${question} Strona: ${urlContent}}`;
    const response = await openai.interact(prompt);
    log('Odpowiedź z openai: ', response);
    const responseJSON = response && JSON.parse(response);
    return responseJSON?.answer;
}

const main = async () => {
    const questionsResponse = await axios.get(QUESTIONS_URL);
    const questions = questionsResponse.data;
    log(questions);
    const finalAnswer: { [key: string]: string } = {};
    let urlToCheck = SOFTO_URL;
    await Promise.all(Object.keys(questions).map(async (key: string) => {
        const question = questions[key];

        while (true) {
            const urlContent = await getUrlContent(urlToCheck);
            const answer = await getOpenaiAnswer(question, urlContent);
            if (answer.startsWith('/') || answer.startsWith('http')) {
                log('Sprawdzam stronkę: ', { answer });
                urlToCheck = getUrl(answer);
            } else {
                log('Odpowiedź na pytanie: ', { question, answer });
                const parsedAnswer = answer.replace('Answer: ', '');
                finalAnswer[key] = parsedAnswer;
                break;
            }
        }

    }));

    const response = await central.verify(finalAnswer);
    log('Odpowiedź z centrali: ', response);
    log('Odpowiedzi na pytania: ', finalAnswer);
}

main();