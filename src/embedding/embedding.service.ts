import { Injectable } from '@nestjs/common';

import * as use from '@tensorflow-models/universal-sentence-encoder';

@Injectable()
export class LocalEmbeddingService {
  private model: use.UniversalSentenceEncoder | null = null;
  private modelPromise: Promise<use.UniversalSentenceEncoder> | null = null;

  async loadModel(): Promise<use.UniversalSentenceEncoder> {
    if (this.model) return this.model;

    if (!this.modelPromise) {
      this.modelPromise = use.load().then((m) => {
        this.model = m;
        return m;
      });
    }

    return this.modelPromise;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = await this.loadModel();
    const embeddings = await model.embed([text]);
    const arr = embeddings.arraySync() as number[][];
    return arr[0];
  }
}
