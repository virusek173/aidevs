import { Builder, WebDriver } from "selenium-webdriver";

export class Selenium {
  private url: string;
  private driver: WebDriver;

  constructor(url: string, driver: WebDriver) {
    this.url = url;
    this.driver = driver;
  }

  static async create(url: string): Promise<Selenium> {
    let driver = await new Builder().forBrowser("chrome").build();
    await driver.get(url);

    return new Selenium(url, driver);
  }

  getDriver(): WebDriver {
    return this.driver;
  }
}
