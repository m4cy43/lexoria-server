import OpenAI from 'openai';

import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAiService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(
    text: string,
    model: 'small' | 'large' = 'small',
    dimensions: number = 512,
  ): Promise<number[]> {
    const modelName =
      model === 'small' ? 'text-embedding-3-small' : 'text-embedding-3-large';
    const res = await this.client.embeddings.create({
      model: modelName,
      input: text,
      dimensions,
    });
    return res.data[0].embedding;
  }

  async askLLM(
    systemPrompt: string,
    userPrompt: string,
    model: string = 'gpt-4o-mini',
    temperature: number = 0.7,
  ): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: temperature,
    });
    return res.choices[0].message?.content || '';
  }
}
