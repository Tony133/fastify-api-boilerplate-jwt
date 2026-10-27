import { Generated, ColumnType } from 'kysely';

export interface UserTable {
  id: Generated<string>;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
  dateOfRegistration: ColumnType<Date, Date | string | undefined, never>;
  dateOfLastAccess: ColumnType<Date, Date | string | undefined, Date>;
}

export interface Database {
  users: UserTable;
}
