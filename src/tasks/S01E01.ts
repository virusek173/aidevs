import axios from "axios";
import { OpenAi } from "../common/openai.js";
import { By, WebElement, WebDriver } from "selenium-webdriver";
import { Selenium } from "../common/selenium.js";
import dotenv from "dotenv";

dotenv.config();
const { URL_XYZ } = process.env;
if (!URL_XYZ) throw new Error("URL_XYZ environment variable is not set");

const main = async (): Promise<void> => {
  const openAi: OpenAi = new OpenAi();

  const selenium: Selenium = await Selenium.create(URL_XYZ);
  const driver: WebDriver = selenium.getDriver();

  const usernameInput: WebElement = await driver.findElement(By.name("username"));
  await usernameInput.sendKeys("tester");

  const passwordInput: WebElement = await driver.findElement(By.name("password"));
  await passwordInput.sendKeys("574e112a");

  const questionElement: WebElement = await driver.findElement(By.id("human-question"));
  const question: string = await questionElement.getText();
  const answer: string | null = await openAi.interact(
    `${question} odpowiedz tylko rokiem, który jest liczbą w formacie xxxx, niczym, więcej. `
  );

  const answerInput: WebElement = await driver.findElement(By.name("answer"));
  await answerInput.sendKeys(answer ?? "");

  const loginButton: WebElement = await driver.findElement(By.id("submit"));
  await loginButton.click();
};

main();
