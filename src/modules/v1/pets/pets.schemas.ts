import { z } from 'zod/v4-mini';

const petSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.nullable(z.string()),
  birthDate: z.nullable(z.coerce.date()),
  sex: z.nullable(z.enum(['MALE', 'FEMALE', 'UNKNOWN'])),
  notes: z.nullable(z.string()),
  primaryTutorId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const petCreateBodySchema = z.object({
  name: z.string().check(z.minLength(1), z.maxLength(120)),
  species: z.string().check(z.minLength(1), z.maxLength(60)),
  breed: z.optional(z.string().check(z.maxLength(80))),
  birthDate: z.optional(z.coerce.date()),
  sex: z.optional(z.enum(['MALE', 'FEMALE', 'UNKNOWN'])),
  notes: z.optional(z.string().check(z.maxLength(2000))),
});

const petIdParamSchema = z.object({
  petId: z.string(),
});

const feedingBodySchema = z.object({
  type: z.enum(['FEED', 'NATURAL', 'MIXED', 'OTHER']),
  description: z.string().check(z.minLength(1), z.maxLength(500)),
  startsAt: z.coerce.date(),
});

const weightBodySchema = z.object({
  weightGrams: z.number().check(z.gt(0)),
  measuredAt: z.coerce.date(),
  note: z.optional(z.string().check(z.maxLength(500))),
});

const consultationBodySchema = z.object({
  occurredAt: z.coerce.date(),
  clinicName: z.optional(z.string().check(z.maxLength(120))),
  vetName: z.optional(z.string().check(z.maxLength(120))),
  notes: z.optional(z.string().check(z.maxLength(5000))),
});

const examBodySchema = z.object({
  type: z.string().check(z.minLength(1), z.maxLength(80)),
  occurredAt: z.coerce.date(),
  notes: z.optional(z.string().check(z.maxLength(5000))),
  fileIds: z.array(z.string()).check(z.minLength(1)),
});

const vaccinationBodySchema = z.object({
  vaccineName: z.string().check(z.minLength(1), z.maxLength(120)),
  appliedAt: z.coerce.date(),
  vetName: z.string().check(z.minLength(1), z.maxLength(120)),
  nextDoseAt: z.optional(z.coerce.date()),
  reminderEnabled: z.boolean(),
  nextDoseReminderAt: z.optional(z.coerce.date()),
  notes: z.optional(z.string().check(z.maxLength(5000))),
  fileId: z.optional(z.string()),
});

const sanitaryBodySchema = z.object({
  category: z.enum(['DEWORMER', 'ANTIPARASITIC']),
  productName: z.string().check(z.minLength(1), z.maxLength(120)),
  appliedAt: z.coerce.date(),
  nextApplicationAt: z.optional(z.coerce.date()),
  reminderEnabled: z.boolean(),
  notes: z.optional(z.string().check(z.maxLength(1000))),
});

const recordTypeParamSchema = z.object({
  petId: z.string(),
  recordType: z.enum([
    'FEEDING',
    'WEIGHT',
    'CONSULTATION',
    'EXAM',
    'VACCINATION',
    'SANITARY',
  ]),
  recordId: z.string(),
});

const clinicalRecordUpdateBodySchema = z.object({
  version: z.number().check(z.gte(1)),
  payload: z.record(z.string(), z.unknown()),
});

const clinicalRecordSchema = z.object({
  petId: z.string(),
  recordType: z.enum([
    'FEEDING',
    'WEIGHT',
    'CONSULTATION',
    'EXAM',
    'VACCINATION',
    'SANITARY',
  ]),
  recordId: z.string(),
  eventAt: z.coerce.date(),
  version: z.number(),
  payload: z.record(z.string(), z.unknown()),
});

export {
  clinicalRecordSchema,
  clinicalRecordUpdateBodySchema,
  consultationBodySchema,
  examBodySchema,
  feedingBodySchema,
  petCreateBodySchema,
  petIdParamSchema,
  petSchema,
  recordTypeParamSchema,
  sanitaryBodySchema,
  vaccinationBodySchema,
  weightBodySchema,
};
