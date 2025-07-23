import { Author } from '../../author/interfaces/author.interface';
import { Category } from '../../category/interfaces/category.interface';
import { Publisher } from '../../publisher/interfaces/publisher.interface';

export interface Book {
  id: string;
  title: string;
  description?: string;
  publishedDate?: Date;
  imageUrl?: string;
  authors: Author[];
  categories: Category[];
  publisher?: Publisher;
}
