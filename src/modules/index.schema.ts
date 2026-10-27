export const publicSchema = {
  tags: ['default'],
  summary: 'Access public resource',
  description: 'Access to this resource does not require authentication',
  security: []
};

export const secureSchema = {
  tags: ['default'],
  summary: 'Access protected resource',
  description: 'Access to this resource requires a valid JWT token',
  security: [{ BearerAuth: [] }]
};
