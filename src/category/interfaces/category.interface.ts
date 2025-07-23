import { Book } from '../../book/interfaces/book.interface';

export interface Category {
  id: string;
  name: string;
  books?: Book[];
}
