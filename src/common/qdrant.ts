import { Builder, WebDriver } from "selenium-webdriver";
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
import { OpenAi } from "./openai.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

dotenv.config();
const { QDRANT_URL, QDRANT_API_KEY } = process.env;

export class Qdrant {
  private client: QdrantClient;
  private openai: OpenAi;
  private dirname: string;

  constructor(openai: OpenAi, dirname: string) {
    this.openai = openai;
    this.dirname = dirname;
    this.client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
    });
  }

  async ensureCollection(name: string) {
    const collections = await this.client.getCollections();
    if (!collections.collections.some((c) => c.name === name)) {
      console.log("creating collection");

      await this.client.createCollection(name, {
        vectors: { size: 3072, distance: "Cosine" },
      });
    }
  }

  async addPoints(
    collectionName: string,
    points: Array<{
      id?: string;
      text: string;
      metadata?: Record<string, any>;
    }>
  ) {
    const pointsToUpsert = await Promise.all(
      points.map(async (point) => {
        const embedding = await this.openai.createEmbedding(point.text);

        return {
          id: point.id || uuidv4(),
          vector: embedding,
          payload: {
            text: point.text,
            ...point.metadata,
          },
        };
      })
    );

    console.log({ pointsToUpsert });

    const pointsFilePath = path.join(this.dirname, "points.json");

    // Check if the file exists
    try {
      await fs.access(pointsFilePath);
      console.log("File already exists, not writing.");
    } catch {
      // File does not exist, proceed to write
      await fs.writeFile(
        pointsFilePath,
        JSON.stringify(pointsToUpsert, null, 2)
      );
    }

    await this.client.upsert(collectionName, {
      wait: true,
      points: pointsToUpsert,
    });
  }

  async search(collectionName: string, query: string, limit: number = 3) {
    // Create embedding from query.
    const queryEmbedding = await this.openai.createEmbedding(query);
    return this.client.search(collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });
  }

  async initializeCollectionWithData(
    name: string,
    points: Array<{
      id?: string;
      text: string;
      metadata?: Record<string, any>;
    }>
  ) {
    const collections = await this.client.getCollections();
    if (!collections.collections.some((c) => c.name === name)) {
      await this.ensureCollection(name);
      await this.addPoints(name, points);
    }
  }
}
