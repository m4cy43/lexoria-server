import { Book } from '../../book/interfaces/book.interface';

export interface Publisher {
  id: string;
  name: string;
  books?: Book[];
}
