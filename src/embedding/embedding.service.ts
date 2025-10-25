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

  averageEmbedding(embeddings: number[][]): number[] {
    if (!embeddings.length) return [];
    const dim = embeddings[0].length;
    const sum = new Array(dim).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < dim; i++) {
        sum[i] += emb[i];
      }
    }

    return sum.map((x) => x / embeddings.length);
  }

  weightedAverageEmbedding(
    groups: { embeddings: number[][]; weight: number }[],
  ): number[] {
    const dim = groups[0]?.embeddings[0]?.length || 0;
    if (!dim) return [];

    const sum = new Array(dim).fill(0);
    let totalWeight = 0;

    for (const { embeddings, weight } of groups) {
      if (!embeddings.length) continue;
      const avg = this.averageEmbedding(embeddings);
      for (let i = 0; i < dim; i++) {
        sum[i] += avg[i] * weight;
      }
      totalWeight += weight;
    }

    return sum.map((x) => x / totalWeight);
  }
}
