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
  ): Promise<number[]> {
    const modelName =
      model === 'small' ? 'text-embedding-3-small' : 'text-embedding-3-large';
    const res = await this.client.embeddings.create({
      model: modelName,
      input: text,
    });
    return res.data[0].embedding;
  }
}
