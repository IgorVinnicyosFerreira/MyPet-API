import { z } from 'zod/v4-mini';

const prescriptionSchema = z.object({
  id: z.string(),
  petId: z.string(),
  medicationId: z.string(),
  dosageValue: z.number(),
  dosageUnit: z.enum(['TABLET_FRACTION', 'DROPS', 'ML', 'UNIT', 'OTHER']),
  dosageOtherDescription: z.optional(z.string()),
  frequencyValue: z.number(),
  frequencyUnit: z.enum(['HOURS', 'DAYS', 'WEEKS']),
  startsAt: z.coerce.date(),
  nextDoseAt: z.coerce.date(),
  reminderEnabled: z.boolean(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED']),
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const prescriptionBodySchema = z.object({
  petId: z.string(),
  medicationId: z.optional(z.string()),
  medicationName: z.optional(z.string().check(z.minLength(1), z.maxLength(120))),
  medicationDescription: z.optional(z.string().check(z.maxLength(500))),
  dosageValue: z.number().check(z.gt(0)),
  dosageUnit: z.enum(['TABLET_FRACTION', 'DROPS', 'ML', 'UNIT', 'OTHER']),
  dosageOtherDescription: z.optional(z.string().check(z.maxLength(120))),
  frequencyValue: z.number().check(z.gt(0)),
  frequencyUnit: z.enum(['HOURS', 'DAYS', 'WEEKS']),
  startsAt: z.coerce.date(),
  reminderEnabled: z.optional(z.boolean()),
});

const prescriptionUpdateBodySchema = z.object({
  version: z.number().check(z.gte(1)),
  reminderEnabled: z.optional(z.boolean()),
  status: z.optional(z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED'])),
  startsAt: z.optional(z.coerce.date()),
  frequencyValue: z.optional(z.number().check(z.gt(0))),
  frequencyUnit: z.optional(z.enum(['HOURS', 'DAYS', 'WEEKS'])),
});

const prescriptionIdParamSchema = z.object({
  prescriptionId: z.string(),
});

const doseRecordBodySchema = z.object({
  takenAt: z.coerce.date(),
  prescriptionVersion: z.number().check(z.gte(1)),
  notes: z.optional(z.string().check(z.maxLength(1000))),
});

const doseRecordSchema = z.object({
  id: z.string(),
  prescriptionId: z.string(),
  petId: z.string(),
  scheduledFor: z.coerce.date(),
  takenAt: z.coerce.date(),
  status: z.enum(['TAKEN', 'LATE', 'SKIPPED']),
  isRetroactive: z.boolean(),
  nextDoseRecalculated: z.boolean(),
  notes: z.nullable(z.string()),
});

const medicationAgendaParamSchema = z.object({
  petId: z.string(),
});

const medicationAgendaQuerySchema = z.object({
  date: z.string(),
});

const medicationAgendaSchema = z.object({
  petId: z.string(),
  date: z.string(),
  items: z.array(
    z.object({
      prescriptionId: z.string(),
      medicationName: z.string(),
      nextDoseAt: z.coerce.date(),
      dosageLabel: z.string(),
    }),
  ),
});

export {
  doseRecordBodySchema,
  doseRecordSchema,
  medicationAgendaParamSchema,
  medicationAgendaQuerySchema,
  medicationAgendaSchema,
  prescriptionBodySchema,
  prescriptionIdParamSchema,
  prescriptionSchema,
  prescriptionUpdateBodySchema,
};
