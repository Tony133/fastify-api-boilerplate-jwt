export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER'
} as const;

export type Role = (typeof Role)[keyof typeof Role];
