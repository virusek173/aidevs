import OpenAI from "openai";

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
