import { Type, type Static } from '@fastify/type-provider-typebox';
import { Role } from '../../shared/enums/role.enum';

export const UserSchema = {
  email: Type.String({ format: 'email', description: 'User email address' }),
  password: Type.String({ minLength: 6, description: 'User password' }),
  firstName: Type.String({ minLength: 3, description: 'User first name' }),
  lastName: Type.String({ minLength: 3, description: 'User last name' }),
  dateOfRegistration: Type.String({
    format: 'date',
    description: 'Date of user registration'
  }),
  dateOfLastAccess: Type.String({
    format: 'date',
    description: 'Date of last user access'
  })
};

export const UserBodySchema = Type.Object(
  {
    id: Type.String({ description: 'User ID' }),
    roles: Type.Array(Type.Enum(Role), { description: 'User roles' }),
    // isVerified: Type.Boolean(), // optional
    ...UserSchema
  },
  {
    description: 'User schema'
  }
);

export const UserResponse = Type.Omit(UserBodySchema, ['password'], {
  description: 'User response schema without password'
});

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

export const SuccessResponse = Type.Object(
  {
    success: Type.Boolean({
      description: 'Indicates if the operation was successful'
    }),
    message: Type.String({ description: 'Response message' })
  },
  {
    description: 'Standard success response format'
  }
);

export const createUserSchema = {
  tags: ['users'],
  summary: 'Create user',
  description: 'create a new user',
  body: Type.Omit(UserBodySchema, [
    'id',
    'roles',
    'isVerified',
    'dateOfRegistration',
    'dateOfLastAccess'
  ]),
  response: {
    401: ErrorResponse,
    403: ErrorResponse,
    409: ErrorResponse,
    201: UserResponse,
    400: ErrorResponse,
    500: ErrorResponse
  }
};

export const getAllUsersSchema = {
  tags: ['users'],
  summary: 'Get all users',
  description: 'Get all users',
  response: {
    401: ErrorResponse,
    403: ErrorResponse,
    200: Type.Array(UserResponse),
    500: ErrorResponse
  }
};

export const getUserSchema = {
  tags: ['users'],
  summary: 'Get user by id',
  description: 'Get a user by ID',
  params: Type.Object({
    id: Type.String({ format: 'uuid', description: 'User ID' })
  }),
  response: {
    401: ErrorResponse,
    403: ErrorResponse,
    200: UserResponse,
    400: ErrorResponse,
    404: ErrorResponse
  }
};

export const updateUserSchema = {
  tags: ['users'],
  summary: 'Update user by id',
  description: 'Update a user by ID',
  params: Type.Object({
    id: Type.String({ format: 'uuid', description: 'User ID' })
  }),
  body: Type.Partial(
    Type.Omit(UserBodySchema, [
      'id',
      'roles',
      'isVerified',
      'password',
      'dateOfRegistration',
      'dateOfLastAccess'
    ])
  ),
  response: {
    401: ErrorResponse,
    403: ErrorResponse,
    200: UserResponse,
    400: ErrorResponse,
    404: ErrorResponse
  }
};

export const deleteUserSchema = {
  tags: ['users'],
  summary: 'Delete user by id',
  description: 'Delete a user by ID',
  params: Type.Object({
    id: Type.String({ format: 'uuid', description: 'User ID' })
  }),
  response: {
    401: ErrorResponse,
    403: ErrorResponse,
    204: {
      description: 'No content'
    },
    404: ErrorResponse
  }
};

export type User = Static<typeof UserBodySchema>;
export type UserParams = Static<typeof getUserSchema.params>;
export type UserResponseSchema = Static<typeof UserResponse>;
export type CreateUserBody = Static<typeof createUserSchema.body>;
export type UpdateUserBody = Static<typeof updateUserSchema.body>;

export type CreateUserDto = CreateUserBody;
export type UpdateUserDto = UpdateUserBody;
