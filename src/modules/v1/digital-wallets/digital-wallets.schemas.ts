import { z } from 'zod/v4-mini';

const digitalWalletParamSchema = z.object({
  petId: z.string(),
});

const digitalWalletQuerySchema = z.object({
  from: z.optional(z.string()),
  to: z.optional(z.string()),
});

const vaccinationSchema = z.object({
  id: z.string(),
  vaccineName: z.string(),
  appliedAt: z.coerce.date(),
  vetName: z.string(),
  nextDoseAt: z.nullable(z.coerce.date()),
  reminderEnabled: z.boolean(),
  nextDoseReminderAt: z.nullable(z.coerce.date()),
  notes: z.nullable(z.string()),
});

const sanitaryRecordSchema = z.object({
  id: z.string(),
  category: z.enum(['DEWORMER', 'ANTIPARASITIC']),
  productName: z.string(),
  appliedAt: z.coerce.date(),
  nextApplicationAt: z.nullable(z.coerce.date()),
  reminderEnabled: z.boolean(),
  notes: z.nullable(z.string()),
});

const digitalWalletSchema = z.object({
  pet: z.object({
    id: z.string(),
    name: z.string(),
    species: z.string(),
    breed: z.nullable(z.string()),
    birthDate: z.nullable(z.coerce.date()),
    primaryTutorId: z.string(),
  }),
  generatedAt: z.coerce.date(),
  vaccinations: z.array(vaccinationSchema),
  sanitaryRecords: z.array(sanitaryRecordSchema),
});

export { digitalWalletParamSchema, digitalWalletQuerySchema, digitalWalletSchema };
