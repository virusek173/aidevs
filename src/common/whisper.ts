import * as fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

export class Whisper {
  async transcript(filePath: string): Promise<string | null> {
    try {
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: fs.createReadStream(filePath),
        language: "pl",
      });

      return transcription.text;
    } catch (error: any) {
      console.error("OpenAI Error:", (error as Error).message);
      return null;
    }
  }
}
