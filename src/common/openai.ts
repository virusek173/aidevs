import * as fs from "fs";
import OpenAI from "openai";
import {
  ChatCompletionMessageParam,
  CreateEmbeddingResponse,
} from "openai/resources/index.mjs";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import axios from "axios";

const Response = z.object({
  _toughts: z.string(),
  answer: z.string(),
});

interface Message {
  role: "system" | "user";
  content: string;
}

const openai = new OpenAI();

export class OpenAi {
  private systemContext: Message;

  constructor(systemPrompt?: string) {
    this.systemContext = {
      role: "system",
      content: systemPrompt || "You are helpful ass",
    };
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response: CreateEmbeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
  }

  getFileTxt(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    const txtContentFile = imageBuffer.toString();

    return txtContentFile;
  }

  async getImage(imagePath: string): Promise<string> {
    if (imagePath.startsWith("http")) {
      return await axios
        .get(imagePath, { responseType: "arraybuffer" })
        .then((response) =>
          Buffer.from(response.data, "binary").toString("base64")
        );
    } else {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString("base64");
      return imageBase64;
    }
  }

  async visionGnerate(userPrompt: string): Promise<string> {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: userPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      });

      return response.data[0].url ?? "";
    } catch (error: any) {
      console.error("OpenAI Error:", (error as Error).message);
      return "";
    }
  }

  async visionInteract(
    userPrompt: string,
    imagePath: string
  ): Promise<string | null> {
    const imageBase64 = await this.getImage(imagePath);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        response_format: zodResponseFormat(Response, "response"),
        max_tokens: 300,
      });

      return completion.choices[0].message.content;
    } catch (error: any) {
      console.error("OpenAI Error:", (error as Error).message);
      return null;
    }
  }

  async interact(userPrompt: string): Promise<string | null> {
    const userContext: Message = {
      role: "user",
      content: userPrompt,
    };

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [this.systemContext, userContext],
        response_format: zodResponseFormat(Response, "response"),
      });

      return completion.choices[0].message.content;
    } catch (error: any) {
      console.error("OpenAI Error:", (error as Error).message);
      return null;
    }
  }
}
