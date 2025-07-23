import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Author } from '../author/entities/author.entity';
import { Book } from '../book/entities/book.entity';
import { Category } from '../category/entities/category.entity';
import { Publisher } from '../publisher/entities/publisher.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Book) private bookRepo: Repository<Book>,
    @InjectRepository(Author) private authorRepo: Repository<Author>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Publisher) private publisherRepo: Repository<Publisher>,
  ) {}

  async runImport() {
    const filePath = path.join(process.cwd(), 'data', 'books_data.csv');
    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    for (const row of rows) {
      const {
        Title: title,
        description,
        authors,
        image,
        publishedDate,
        publisher,
        categories,
      } = row;

      let publisherEntity: Publisher | null = null;
      if (publisher) {
        publisherEntity =
          (await this.publisherRepo.findOneBy({ name: publisher })) ||
          this.publisherRepo.create({ name: publisher });
      }

      const authorEntities: Author[] = [];
      if (authors) {
        const authorNames = this.parseCsvStringArrays(authors);
        for (const name of authorNames) {
          let author = await this.authorRepo.findOneBy({ name });
          if (!author) {
            author = this.authorRepo.create({ name });
            await this.authorRepo.save(author);
          }
          authorEntities.push(author);
        }
      }

      const categoryEntities: Category[] = [];
      if (categories) {
        const categoryNames = this.parseCsvStringArrays(categories);
        for (const name of categoryNames) {
          let category = await this.categoryRepo.findOneBy({ name });
          if (!category) {
            category = this.categoryRepo.create({ name });
            await this.categoryRepo.save(category);
          }
          categoryEntities.push(category);
        }
      }

      const book = this.bookRepo.create({
        title,
        description,
        imageUrl: image,
        publishedDate: this.parsePublishedDate(publishedDate),
        publisher: publisherEntity || null,
        authors: authorEntities,
        categories: categoryEntities,
      });

      await this.bookRepo.save(book);
    }

    console.log(`✅ Imported books: ${rows.length}`);
  }

  parsePublishedDate(value: string): Date | null {
    if (!value) return null;

    if (/^\d{4}$/.test(value.trim())) {
      return new Date(`${value}-01-01`);
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  parseCsvStringArrays(raw: string): string[] {
    try {
      const fixed = raw.replace(/'/g, '"');
      const parsed = JSON.parse(fixed);

      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === 'string')
      ) {
        return parsed.map((s) => s.trim());
      }
    } catch (err) {
      return raw.split(',').map((s) => s.replace(/[\[\]'"“”]/g, '').trim());
    }

    return [];
  }
}
