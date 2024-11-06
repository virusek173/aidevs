import axios from "axios";

const URL_OLLAMA = `http://localhost:11434/api/chat`;

export class Ollama {
  constructor(systemPrompt, model = "gemma2:2b", url = URL_OLLAMA) {
    this.systemContext = {
      role: "system",
      content: systemPrompt || "You are helpful ass",
    };
    this.url = url;
    this.model = model;
  }

  async interact(userPrompt) {
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
  }
}
