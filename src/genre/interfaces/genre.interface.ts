import { Book } from '../../book/interfaces/book.interface';

export interface Genre {
  id: string;
  name: string;
  books?: Book[];
}
