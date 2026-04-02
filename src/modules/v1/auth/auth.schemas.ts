import { z } from 'zod/v4-mini';

const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const authRegisterBodySchema = z.object({
  name: z.string().check(z.minLength(3), z.maxLength(120)),
  email: z.string().check(z.minLength(5), z.maxLength(254)),
  password: z.string().check(z.minLength(8), z.maxLength(72)),
});

const authLoginBodySchema = z.object({
  email: z.string().check(z.minLength(5), z.maxLength(254)),
  password: z.string().check(z.minLength(8), z.maxLength(72)),
});

const authTokenResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
  user: authUserSchema,
});

const authRegisterResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  token: z.string(),
  expiresIn: z.number().check(z.gt(0)),
});

export {
  authLoginBodySchema,
  authRegisterResponseSchema,
  authRegisterBodySchema,
  authTokenResponseSchema,
  authUserSchema,
};
