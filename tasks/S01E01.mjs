import axios from "axios";
import { OpenAi } from "../common/openai.mjs";
import { By } from "selenium-webdriver";
import { Selenium } from "../common/selenium.mjs";
import dotenv from "dotenv";

dotenv.config();
const { URL_XYZ } = process.env;

const main = async () => {
  const openAi = new OpenAi();

  const selenium = await Selenium.create(URL_XYZ);
  const driver = selenium.getDriver();

  const usernameInput = await driver.findElement(By.name("username"));
  usernameInput.sendKeys("tester");

  const passwordInput = await driver.findElement(By.name("password"));
  passwordInput.sendKeys("574e112a");

  let questionElement = await driver.findElement(By.id("human-question"));
  let question = await questionElement.getText();
  let answer = await openAi.interact(
    `${question} odpowiedz tylko rokiem, który jest liczbą w formacie xxxx, niczym, więcej. `
  );

  const answerInput = await driver.findElement(By.name("answer"));
  answerInput.sendKeys(answer);

  const loginButton = await driver.findElement(By.id("submit"));
  loginButton.click();
};

main();
