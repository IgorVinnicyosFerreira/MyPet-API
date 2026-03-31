import { z } from 'zod/v4-mini';

const careRelationParamSchema = z.object({
  petId: z.string(),
});

const careRelationBodySchema = z.object({
  userId: z.string(),
  role: z.enum(['CO_TUTOR', 'CAREGIVER']),
});

const careRelationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  userId: z.string(),
  role: z.enum(['PRIMARY_TUTOR', 'CO_TUTOR', 'CAREGIVER']),
  status: z.enum(['PENDING', 'ACTIVE', 'REVOKED']),
  invitedByUserId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  revokedAt: z.nullable(z.coerce.date()),
});

export { careRelationBodySchema, careRelationParamSchema, careRelationSchema };
