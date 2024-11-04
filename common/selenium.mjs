import { Builder, By, Key, until } from "selenium-webdriver";

export class Selenium {
  constructor(url, driver) {
    this.url = url;
    this.driver = driver;
  }

  static async create(url) {
    let driver = await new Builder().forBrowser("chrome").build();
    await driver.get(url);

    return new Selenium(url, driver);
  }

  getDriver() {
    return this.driver;
  }
}
