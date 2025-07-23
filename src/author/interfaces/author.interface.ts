import { Book } from '../../book/interfaces/book.interface';

export interface Author {
  id: string;
  name: string;
  books?: Book[];
}
