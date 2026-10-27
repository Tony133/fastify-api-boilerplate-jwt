import { Type, type Static } from '@fastify/type-provider-typebox';

export const RegisterBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email', description: 'User email address' }),
    password: Type.String({ minLength: 6, description: 'User password' }),
    firstName: Type.String({ minLength: 3, description: 'User first name' }),
    lastName: Type.String({ minLength: 3, description: 'User last name' })
    // roles, dateOfRegistration and dateOfLastAccess are set by the server:
    // a client cannot choose its role nor back-date its registration.
  },
  {
    additionalProperties: false,
    description: 'Request body for user registration'
  }
);

export const ErrorResponse = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error type' }),
    message: Type.String({ description: 'Error message' })
  },
  {
    additionalProperties: true,
    description: 'Standard error response format'
  }
);

export const registerSchema = {
  tags: ['register'],
  summary: 'Register user',
  description: 'Register a new user',
  security: [],
  body: RegisterBodySchema,
  response: {
    201: Type.Object({
      id: Type.String({ description: 'User ID' }),
      email: Type.String({
        format: 'email',
        description: 'User email address'
      }),
      firstName: Type.String({ minLength: 3, description: 'User first name' }),
      lastName: Type.String({ minLength: 3, description: 'User last name' }),
      roles: Type.Array(Type.String(), { description: 'User roles' }),
      dateOfRegistration: Type.String({
        format: 'date',
        description: 'Date of user registration (set by the server)'
      }),
      dateOfLastAccess: Type.Union([Type.String({ format: 'date' }), Type.Null()], {
        description: 'Date of last user access (null until the first login)'
      })
    }),
    400: ErrorResponse,
    409: ErrorResponse,
    500: ErrorResponse
  }
};

export type RegisterBody = Static<typeof RegisterBodySchema>;
export type RegisterPayload = RegisterBody;
