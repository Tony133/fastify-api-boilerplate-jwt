import { Type, type Static } from '@fastify/type-provider-typebox';

export const ChangePasswordBodySchema = Type.Object(
  {
    oldPassword: Type.String({
      minLength: 6,
      description: 'Current user password'
    }),
    newPassword: Type.String({ minLength: 6, description: 'New user password' })
  },
  {
    additionalProperties: false,
    description: 'Request body for changing user password'
  }
);

export const ChangePasswordResponseSchema = Type.Object(
  {
    success: Type.Boolean({
      description: 'Indicates if the password change was successful'
    }),
    message: Type.String({ description: 'Response message' })
  },
  {
    description: 'Response schema for password change operation'
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

export const changePasswordSchema = {
  tags: ['change-password'],
  summary: 'Change password',
  description:
    'Change user password by providing the old password and a new password',
  body: ChangePasswordBodySchema,
  response: {
    200: ChangePasswordResponseSchema,
    400: ErrorResponse,
    404: ErrorResponse
  }
};

export type ChangePasswordBody = Static<typeof ChangePasswordBodySchema>;

export type ChangePasswordDto = ChangePasswordBody;
