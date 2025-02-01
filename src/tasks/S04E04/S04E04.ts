import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { OpenAi } from '../../common/openai.js';

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const openai = new OpenAi(`Jesteś dronem, który eksploruje planszę o wymiarach 4x4. Plansza przedstawia różne typy terenu i wygląda następująco:

- (0,0) - punkt startowy
- (0,1) - trawa
- (0,2) - drzewo
- (0,3) - dom
- (1,0) - trawa
- (1,1) - wiatrak
- (1,2) - trawa
- (1,3) - trawa
- (2,0) - trawa
- (2,1) - trawa
- (2,2) - skały
- (2,3) - drzewa
- (3,0) - skały
- (3,1) - skały
- (3,2) - samochód
- (3,3) - jaskinia

Rozpoczynasz swoją podróż w punkcie (0,0). Otrzymasz sekwencję instrukcji, które poprowadzą Cię przez planszę. Twoim zadaniem jest określenie, nad jakim obiektem się zatrzymasz po wykonaniu wszystkich instrukcji. Instrukcja nie zawsze będzie miała podaną ilość ruchów. Czasami może być w niej, że poruszamy się do końca/na maksa, co znaczy, że dron porusza się do końca planszy w danym kierunku.

Podaj nazwę obiektu, na którym się znajdziesz po zakończeniu podróży.
`);
const getOpenaiAnswer = async (prompt: string) => {
    const response = await openai.interact(prompt)
    console.log('Odpowiedź z openai: ', response);
    const responseJSON = response && JSON.parse(response);
    return responseJSON?.answer;
}

app.post('/', async (req: Request, res: Response) => {
    let data = req.body;
    const { instruction } = data;
    console.log({ instruction })

    const opeanAiResponse = await getOpenaiAnswer(instruction);
    res.send({ description: opeanAiResponse });
})

app.listen(8080, () => {
    console.log('Example app listening on port 8080!')
})