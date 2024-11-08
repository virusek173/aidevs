import axios from "axios";

const URL_OLLAMA: string = `http://localhost:11434/api/chat`;

export const MODELS = {
  GEMMA2B: "gemma2:2b",
  GEMMA: "gemma2",
  LAMMA: "llama3.1",
  LAMMA_UNCENSORED: "llama2-uncensored",
} as const;

type ModelType = typeof MODELS[keyof typeof MODELS];

interface Message {
  role: "system" | "user";
  content: string;
}

export class Ollama {
  private systemContext: Message;
  private url: string;
  private model: ModelType;

  constructor(systemPrompt: string, model: ModelType = MODELS.GEMMA2B, url: string = URL_OLLAMA) {
    this.systemContext = {
      role: "system",
      content: systemPrompt || "You are helpful ass",
    };
    this.url = url;
    this.model = model;
  }

  async interact(userPrompt: string): Promise<string | null> {
    try {
      const userContext: Message = {
        role: "user",
        content: userPrompt,
      };

      const completion = await axios.post(this.url, {
        model: this.model,
        messages: [this.systemContext, userContext],
        stream: false,
      });

      return completion?.data?.message?.content ?? null;
    } catch (error: any) {
      console.log("Error Ollama message:", (error as Error).message);
      return null;
    }
  }
}
