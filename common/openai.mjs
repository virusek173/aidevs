import OpenAI from "openai";
const openai = new OpenAI();

export class OpenAi {
  constructor(systemPrompt) {
    this.systemContext = {
      role: "system",
      content: systemPrompt || "You are helpful ass",
    };
  }

  async interact(userPrompt) {
    const userContext = {
      role: "user",
      content: userPrompt,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [this.systemContext, userContext],
    });

    return completion.choices[0].message.content;
  }
}
