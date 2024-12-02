import axios from "axios";
import { PeopleInfoService } from "../../common/peopleInfo.js";
import { OpenAi } from "../../common/openai.js";
import { Central } from "../../common/central.js";

const peopleInfoService = new PeopleInfoService();
const openai = new OpenAi();
const central = new Central("loop");
let knownPlaces: Array<string> = [];

const parseData = (data: string) => {
  return data
    .replace(/Ó/g, "O")
    .replace(/Ł/g, "L")
    .replace(/Ś/g, "S")
    .replace(/Ż/g, "Z")
    .replace(/Ą/g, "A")
    .replace(/Ć/g, "C")
    .replace(/Ę/g, "E")
    .replace(/Ń/g, "N")
    .replace(/Ź/g, "Z");
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const peopleLoop = async (people: Array<string>): Promise<string> => {
  let places: string = "";
  console.log({ people });
  let result = "";

  const filteredPeople = people.filter(
    (p) => !p.includes("RESTRICTED") && !p.includes("DATA")
  );
  console.log({ filteredPeople });

  for (const person of filteredPeople) {
    const response = await peopleInfoService.query(person, "people");
    console.log({ response });

    places = response.message;
    const cleanedPlaces = parseData(places);

    console.log(`${person}: ${cleanedPlaces}`);
    const palacesArray = cleanedPlaces
      .split(" ")
      .filter((p) => !knownPlaces.includes(p));
    knownPlaces = [...knownPlaces, ...palacesArray];

    result += `${await placesLoop(palacesArray)};`;
  }

  return result;
};

const placesLoop = async (places: Array<string>): Promise<string> => {
  let people: string = "";
  let barbarasPlace: string | null = null;
  let result = "";
  const filteredPlaces = places.filter(
    (p) => !p.includes("RESTRICTED") && !p.includes("DATA")
  );

  for (const place of filteredPlaces) {
    const response = await peopleInfoService.query(place, "places");
    people = response.message;

    const cleanedPeople = parseData(people);

    console.log(`${place}: ${cleanedPeople}`);

    const peopleArray = cleanedPeople.split(" ");

    if (cleanedPeople.includes("BARBARA")) {
      result += `${place};`;
    } else {
      result += `${await peopleLoop(peopleArray)};`;
    }
  }

  return result;
};

const main = async () => {
  const data = await axios.get("https://centrala.ag3nts.org/dane/barbara.txt");
  const openaiResult = await openai.interact(
    `Wypisz osoby i miejsca, które są w podanym tekście: ${data.data}. 
    Odpowiedz w formacie JSON {people: OSOBY, places: MIEJSCA}.
    Wypisując miejsca i osoby wypisz wielkimi literami w mianowniku.
    Wypisz tylko imiona osób.
    Nie popełnij błędu w imionach osób to bardzo ważne.`
  );
  const answer = JSON.parse(openaiResult || "").answer;

  const cleanedAnswer = parseData(answer);

  const answerJSON = JSON.parse(cleanedAnswer);

  console.log({ answerJSON });
  const barbarasPlace = await peopleLoop(answerJSON.people);

  console.log({ barbarasPlace });
  const finalPlaces = barbarasPlace.split(";").filter((p) => !!p);

  for (const place of finalPlaces) {
    const result = await central.verify(place);

    console.log({ result });
  }
};

main();
