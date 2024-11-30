import fs from 'fs';
import path from 'path';
import { OpenAi } from "../../common/openai.js";
import { Central } from '../../common/central.js';

const openai = new OpenAi();

const DATA_DIR = "./src/tasks/S03E01/pliki_z_fabryki";

const main = async () => {
  const reportsDir = `${DATA_DIR}/reports`
  const factsDir = `${DATA_DIR}/facts`

  const reports: Array<{ name: string, text: string }> = [];
  const facts: Array<{ name: string, text: string }> = [];

  // Read reports
  fs.readdirSync(reportsDir).forEach(file => {
    const filePath = path.join(reportsDir, file);
    const text = fs.readFileSync(filePath, 'utf-8');
    reports.push({ name: file, text });
  });

  // Read facts
  fs.readdirSync(factsDir).forEach(file => {
    const filePath = path.join(factsDir, file);
    const text = fs.readFileSync(filePath, 'utf-8');
    facts.push({ name: file, text });
  });

  // Print arrays to debug
  console.log('Reports:', reports);
  console.log('Facts:', facts);

  const openaiFacts = new OpenAi(`Masz określać czy w podanym tekście przez użytkownika są wspomniane
     osoby takie jak w podanych raportach Odpowiedz tylko tak lub nie, niczym więcej.
      ${reports.map(r => r.text).join('\n')} `);

  console.log(`Masz określać czy w podanym tekście przez użytkownika są osoby wspólne z: ${reports.map(r => r.text).join('\n')} 
  Odpowiedz tylko tak lub nie, niczym więcej`);


  // Iterate over facts and run openai.interact for each entry
  // Define the type for important facts
  type ImportantFact = { answer: boolean; text: string };
  let importantFactsMap: Record<string, ImportantFact> = {}; 

  for (const fact of facts) {
    const response = await openaiFacts.interact(fact.text);
    const jsonResponse = response && JSON.parse(response);

    console.log({ jsonResponse });
    const isFactImportant = Boolean(jsonResponse?.answer === 'tak');
    if (isFactImportant) {
      importantFactsMap = { ...importantFactsMap, [fact.name]: { answer: Boolean(jsonResponse?.answer === 'tak'), text: fact.text } }
    }
  }

  console.log({ importantFactsMap });
  const importantFacts = Object.values(importantFactsMap).map((i: ImportantFact) => i.text);
  const openaiKeywords = new OpenAi(`
    W pierwszej kolejności podaj słowa kluczowe na podstawie podanego głównego tekstu.
    Wyciągnij numer sektora z nazwy pliku jako słowo kluczowe.
    Słowa kluczowe z tekstu pomocniczego podaj TYLKO I WYŁĄCZNIE jeśli łączą się w jakiś sposób z głównym tekstem.
    Słowa kluczowe muszą być podane w mianowniku.
    W słowach kluczowych zawrzyj wszystkie występujące w raporcie istoty żywe oraz przedmioty. 
    Podając słowa kluczowe skup się na tym czym zajmują się wymienione osoby ze szczegółami, jakimi technilogiami się zajmują oraz ich powiązaniami.
    Słowa kluczowe podawaj prostym językiem. Np. jak jest, że ruszyło się coś zielonego - rośliny.
    Zanim odpowiesz, przeprowadź rozumowanie w _toughts.
    `);

  let reportsKeywords = {}

  for (const report of reports) {
    const response = await openaiKeywords.interact(`
      ### Nazwa pliku: ${report.name}

      ### Główny tekst: \n ${report.text}

      ### Tekst pomocniczy: \n ${importantFacts.join('\n')}
        `);
      console.log(`
      Główny tekst: ${report.text}
      Tekst pomocniczy: ${importantFacts.join('\n')}
       ` );
      
    console.log({ response });
    const jsonResponse = response && JSON.parse(response);

    reportsKeywords = { ...reportsKeywords, [report.name]: jsonResponse?.answer }
  }

  console.log({ reportsKeywords });


  const cental = new Central('dokumenty')
  const centralResponse = await cental.verify(reportsKeywords);
  console.log({ centralResponse });
};

main();
