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

  meanVector(
    vectors: { vector: number[]; weight?: number }[] | number[][],
  ): number[] {
    if (!Array.isArray(vectors) || vectors.length === 0) return [];
    const withWeights =
      'vector' in vectors[0]
        ? (vectors as { vector: number[]; weight?: number }[])
        : (vectors as number[][]).map((v) => ({ vector: v, weight: 1 }));

    const dim = withWeights[0].vector.length;
    const sum = new Array(dim).fill(0);
    let totalWeight = 0;

    for (const { vector, weight = 1 } of withWeights) {
      totalWeight += weight;
      for (let i = 0; i < dim; i++) sum[i] += vector[i] * weight;
    }
    return sum.map((x) => x / totalWeight);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length) return 0;
    const dot = a.reduce((acc, v, i) => acc + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
    const normB = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0));
    return dot / (normA * normB);
  }
}
