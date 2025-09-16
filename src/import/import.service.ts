import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { BookService } from 'src/book/book.service';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Author } from '../author/entities/author.entity';
import { Book } from '../book/entities/book.entity';
import { Category } from '../category/entities/category.entity';
import { Publisher } from '../publisher/entities/publisher.entity';

@Injectable()
export class ImportService {
  private publisherCache = new Map<string, Publisher>();
  private authorCache = new Map<string, Author>();
  private categoryCache = new Map<string, Category>();

  constructor(
    @InjectRepository(Book) private bookRepo: Repository<Book>,
    @InjectRepository(Author) private authorRepo: Repository<Author>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Publisher) private publisherRepo: Repository<Publisher>,
    private readonly bookService: BookService,
  ) {}

  async runImport() {
    const filePath = path.join(process.cwd(), 'data', 'books_data.csv');

    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found at: ${filePath}`);
    }

    const rows: any[] = [];

    console.log('📖 Reading CSV file...');
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Found ${rows.length} rows to process`);

    // Pre-load existing entities to reduce database queries
    await this.preloadEntities();

    let counter = 0;
    let skipped = 0;
    const batchSize = 500; // Process in batches to avoid memory issues

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}`,
      );

      for (const row of batch) {
        try {
          const {
            Title: title,
            description,
            authors,
            image,
            publishedDate,
            publisher,
            categories,
          } = row;

          // Skip books without title
          if (!title || title.trim() === '') {
            skipped++;
            continue;
          }

          // Skip books without description
          if (!description || description.trim() === '') {
            skipped++;
            continue;
          }

          // Check if book already exists
          const existingBook = await this.bookRepo.findOne({
            where: { title: title.trim() },
          });

          if (existingBook) {
            skipped++;
            continue;
          }

          const publisherEntity = await this.getOrCreatePublisher(publisher);
          const authorEntities = await this.getOrCreateAuthors(authors);
          const categoryEntities = await this.getOrCreateCategories(categories);

          const book = this.bookRepo.create({
            title: title.trim(),
            description: description?.trim() || null,
            imageUrl: image?.trim() || null,
            publishedDate: this.parsePublishedDate(publishedDate),
            publisher: publisherEntity,
            authors: authorEntities,
            categories: categoryEntities,
          });

          const savedBook = await this.bookRepo.save(book);

          // Create embeddings (with error handling)
          try {
            await this.bookService.createChunksEmbeddingsForBook(savedBook);
          } catch (embeddingError) {
            console.error(
              `❌ Failed to create embeddings for "${title}":`,
              embeddingError.message,
            );
            // Continue with import even if embeddings fail
          }

          counter++;

          if (counter % 10 === 0) {
            console.log(`✅ Imported ${counter} books so far...`);
          }
        } catch (error) {
          console.error(
            `❌ Error processing row ${counter + skipped + 1}:`,
            error.message,
          );
          skipped++;
        }
      }
    }

    console.log(`✅ Import completed!`);
    console.log(`📈 Successfully imported: ${counter} books`);
    console.log(`⚠️ Skipped: ${skipped} books`);

    // Clear caches
    this.publisherCache.clear();
    this.authorCache.clear();
    this.categoryCache.clear();
  }

  private async preloadEntities() {
    console.log('🔄 Preloading existing entities...');

    const [publishers, authors, categories] = await Promise.all([
      this.publisherRepo.find(),
      this.authorRepo.find(),
      this.categoryRepo.find(),
    ]);

    // Populate caches
    publishers.forEach((p) => this.publisherCache.set(p.name, p));
    authors.forEach((a) => this.authorCache.set(a.name, a));
    categories.forEach((c) => this.categoryCache.set(c.name, c));

    console.log(
      `📋 Loaded ${publishers.length} publishers, ${authors.length} authors, ${categories.length} categories`,
    );
  }

  private async getOrCreatePublisher(
    publisherName: string,
  ): Promise<Publisher | null> {
    if (!publisherName || publisherName.trim() === '') {
      return null;
    }

    const name = publisherName.trim();

    // Check cache first
    if (this.publisherCache.has(name)) {
      return this.publisherCache.get(name)!;
    }

    // Create new publisher
    const publisher = this.publisherRepo.create({ name });
    const savedPublisher = await this.publisherRepo.save(publisher);

    // Add to cache
    this.publisherCache.set(name, savedPublisher);

    return savedPublisher;
  }

  private async getOrCreateAuthors(authorsString: string): Promise<Author[]> {
    if (!authorsString) return [];

    const authorNames = this.parseCsvStringArrays(authorsString);
    const authors: Author[] = [];

    for (const name of authorNames) {
      const trimmedName = name.trim();
      if (!trimmedName) continue;

      // Check cache first
      if (this.authorCache.has(trimmedName)) {
        authors.push(this.authorCache.get(trimmedName)!);
        continue;
      }

      // Create new author
      const author = this.authorRepo.create({ name: trimmedName });
      const savedAuthor = await this.authorRepo.save(author);

      // Add to cache
      this.authorCache.set(trimmedName, savedAuthor);
      authors.push(savedAuthor);
    }

    return authors;
  }

  private async getOrCreateCategories(
    categoriesString: string,
  ): Promise<Category[]> {
    if (!categoriesString) return [];

    const categoryNames = this.parseCsvStringArrays(categoriesString);
    const categories: Category[] = [];

    for (const name of categoryNames) {
      const trimmedName = name.trim();
      if (!trimmedName) continue;

      // Check cache first
      if (this.categoryCache.has(trimmedName)) {
        categories.push(this.categoryCache.get(trimmedName)!);
        continue;
      }

      // Create new category
      const category = this.categoryRepo.create({ name: trimmedName });
      const savedCategory = await this.categoryRepo.save(category);

      // Add to cache
      this.categoryCache.set(trimmedName, savedCategory);
      categories.push(savedCategory);
    }

    return categories;
  }

  parsePublishedDate(value: string): Date | null {
    if (!value || value.trim() === '') return null;

    const trimmedValue = value.trim();

    // Handle year-only format (e.g., "2023")
    if (/^\d{4}$/.test(trimmedValue)) {
      return new Date(`${trimmedValue}-01-01`);
    }

    // Handle various date formats
    const parsed = new Date(trimmedValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  parseCsvStringArrays(raw: string): string[] {
    if (!raw || raw.trim() === '') return [];

    try {
      // Try to parse as JSON array first
      const fixed = raw.replace(/'/g, '"');
      const parsed = JSON.parse(fixed);

      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === 'string')
      ) {
        return parsed.map((s) => s.trim()).filter((s) => s.length > 0);
      }
    } catch (err) {
      // Fallback: split by comma and clean up
      return raw
        .split(',')
        .map((s) => s.replace(/[\[\]'"""]/g, '').trim())
        .filter((s) => s.length > 0);
    }

    return [];
  }
}
