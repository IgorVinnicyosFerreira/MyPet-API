import { z } from 'zod/v4-mini';

const uploadFileBodySchema = z.object({
  petId: z.string(),
  domain: z.enum(['EXAM', 'VACCINATION']),
  originalName: z.string().check(z.minLength(1), z.maxLength(255)),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  contentBase64: z.string().check(z.minLength(1)),
});

const storedFileSchema = z.object({
  id: z.string(),
  petId: z.string(),
  domain: z.enum(['EXAM', 'VACCINATION']),
  provider: z.literal('LOCAL'),
  relativePath: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  checksum: z.nullable(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export { storedFileSchema, uploadFileBodySchema };
