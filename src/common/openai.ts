import * as fs from "fs";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

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

  getImage(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");

    return imageBase64;
  }

  async visionInteract(
    userPrompt: string,
    imagePath: string
  ): Promise<string | null> {
    const imageBase64 = this.getImage(imagePath);

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
      });

      return completion.choices[0].message.content;
    } catch (error: any) {
      console.error("OpenAI Error:", (error as Error).message);
      return null;
    }
  }
}
