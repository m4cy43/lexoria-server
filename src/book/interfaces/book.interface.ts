import { Author } from '../../author/interfaces/author.interface';
import { Genre } from '../../genre/interfaces/genre.interface';
import { Publisher } from '../../publisher/interfaces/publisher.interface';

export interface Book {
  id: string;
  title: string;
  description?: string;
  publishedDate?: Date;
  imageUrl?: string;
  authors: Author[];
  genres: Genre[];
  publisher?: Publisher;
}
