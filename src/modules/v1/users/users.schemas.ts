import { z } from 'zod/v4-mini';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const userIdParamSchema = z.object({
  userId: z.string(),
});

const userListQuerySchema = z.object({
  name: z.optional(z.string().check(z.minLength(3))),
});

const userUpdateBodySchema = z.object({
  name: z.optional(z.string().check(z.minLength(3), z.maxLength(120))),
  email: z.optional(z.string().check(z.minLength(5), z.maxLength(254))),
});

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()),
    traceId: z.string(),
  }),
});

export {
  errorEnvelopeSchema,
  userIdParamSchema,
  userListQuerySchema,
  userSchema,
  userUpdateBodySchema,
};
