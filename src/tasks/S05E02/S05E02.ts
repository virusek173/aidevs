import axios from "axios"
import dotenv from "dotenv";
import { DatabaseService } from "../../common/database.js";
import { PeopleInfoService } from "../../common/peopleInfo.js";
import { OpenAi } from "../../common/openai.js";
import { Central } from "../../common/central.js";

dotenv.config();
const { SECRET_KEY, URL_CENTRAL } = process.env;
if (!SECRET_KEY) throw new Error("SECRET_KEY environment variable is not set");
if (!URL_CENTRAL)
    throw new Error("URL_CENTRAL environment variable is not set");

const database = new DatabaseService("database");
const peopleInfoService = new PeopleInfoService();
const openai = new OpenAi(`Wypisz wszystkich ludzi, ludzi do wykluczenia oraz miejsca z podanego zapytania. 
    Jeśli w zaputaniu jest wskazane, żeby pominąć jakąś osobę to zapisz ją w polu wykluczeń.
    Wypisz ich w formacie JSON jako 
    {people: [lista znalezionych osób po przecinku], 
    exclude: [lista wykluczonych osób po przecinku],
    places: [lista znalezionych miejsc po przecinku]
    }`);
const central = new Central("gps");

const LOGS_URL = `${URL_CENTRAL}/data/${SECRET_KEY}/gps.txt`
const QUESTIONS_URL = `${URL_CENTRAL}/data/${SECRET_KEY}/gps_question.json`
const main = async () => {
    const logs = await axios.get(LOGS_URL);
    const questionResponse = await axios.get(QUESTIONS_URL);
    const question = questionResponse?.data.question
    console.log(question);

    // Check all places and people in question.
    const response = await openai.interact(question);
    const responseJson = JSON.parse(response || '');
    const answer = JSON.parse(responseJson?.answer)
    const people = answer?.people
    const places = answer?.places
    const exclude = answer?.exclude?.map((person: string) => person.toUpperCase())

    console.log("openai response", response);
    console.log("answer", answer);
    console.log("peopleplaces", people, places);
    console.log("logs", logs.data);

    // Ask all places for people.
    let allPeopleFound: Array<string> = []

    for (const place of places) {
        const peopleFound = await peopleInfoService.query(place, 'places');
        const peopleFoundArray = peopleFound?.message.split(' ');
        allPeopleFound = allPeopleFound.concat(peopleFoundArray)
        console.log("peopleFoundArray", peopleFoundArray);
    }
    allPeopleFound = allPeopleFound.filter((person) => !exclude.includes(person.toUpperCase()))
    console.log("allPeopleFound", allPeopleFound);

    // Ask for all people coordinates
    let finalObject: { [key: string]: any } = {}
    for (const person of allPeopleFound) {
        const idResponse = await database.execute(`SELECT id FROM users WHERE username = "${person}"`);
        const id = idResponse?.reply[0]?.id;
        if (id) {
            const coordinatesResponse = await axios.get(`${URL_CENTRAL}/gps/${id}`, { data: { userID: id } });
            console.log("coordinatesResponse", coordinatesResponse);
            const coordinates = coordinatesResponse?.data?.message;
            finalObject[person] = coordinates;
        }
    }

    const finalResponse = await central.verify(finalObject);
    console.log("finalObject", finalObject);
    console.log("finalResponse", finalResponse);
}

main();