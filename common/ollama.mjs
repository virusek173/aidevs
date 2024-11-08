import axios from "axios";

const URL_OLLAMA = `http://localhost:11434/api/chat`;

export const MODELS = {
  GEMMA2B: "gemma2:2b",
  GEMMA: "gemma2",
  LAMMA: "llama3.1",
  LAMMA_UNCENSORED: "llama2-uncensored",
};

export class Ollama {
  constructor(systemPrompt, model = MODELS.GEMMA2B, url = URL_OLLAMA) {
    this.systemContext = {
      role: "system",
      content: systemPrompt || "You are helpful ass",
    };
    this.url = url;
    this.model = model;
  }

  async interact(userPrompt) {
    try {
      const userContext = {
        role: "user",
        content: userPrompt,
      };

      const completion = await axios.post(this.url, {
        model: this.model,
        messages: [this.systemContext, userContext],
        stream: false,
      });

      return completion?.data?.message?.content;
    } catch (Error) {
      console.log("Error Ollama message:", Error.message);
    }
  }
}
