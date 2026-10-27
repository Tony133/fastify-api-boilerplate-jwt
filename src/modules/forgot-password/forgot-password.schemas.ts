import { Type, type Static } from '@fastify/type-provider-typebox';

export const ForgotPasswordBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email', description: 'User email address' })
  },
  {
    additionalProperties: false,
    description: 'Request body for forgot password'
  }
);

export const ForgotPasswordResponseSchema = Type.Object(
  {
    success: Type.Boolean({
      description: 'Indicates if the operation was successful'
    }),
    message: Type.String({ description: 'Response message' })
  },
  {
    description: 'Response schema for forgot password operation'
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

export const forgotPasswordSchema = {
  tags: ['forgot-password'],
  summary: 'Forgot password',
  security: [],
  description:
    'Requests a password reset. Always answers 200 with the same message, whether or not the email is registered.',
  body: ForgotPasswordBodySchema,
  response: {
    200: ForgotPasswordResponseSchema,
    429: ErrorResponse,
    500: ErrorResponse
  }
};

export type ForgotPasswordBody = Static<typeof ForgotPasswordBodySchema>;
export type ForgotPasswordDto = ForgotPasswordBody;
