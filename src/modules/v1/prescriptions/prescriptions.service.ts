import { HttpError } from '@/lib/http/error-handler';
import { ensureRolePermission } from '@/lib/http/permissions';
import type {
  DoseRecordInput,
  FrequencyUnit,
  PrescriptionInput,
  PrescriptionUpdateInput,
} from './prescriptions.types';
import type { IPrescriptionsRepository } from './repositories/prescriptions-interfaces.repository';

function addFrequency(date: Date, value: number, unit: FrequencyUnit) {
  const next = new Date(date);

  if (unit === 'HOURS') {
    next.setHours(next.getHours() + value);
    return next;
  }

  if (unit === 'DAYS') {
    next.setDate(next.getDate() + value);
    return next;
  }

  next.setDate(next.getDate() + value * 7);
  return next;
}

export class PrescriptionsService {
  constructor(private readonly repository: IPrescriptionsRepository) {}

  private normalizePrescription(record: Record<string, unknown>) {
    const dosageValueInput = record.dosageValue;
    let dosageValue: unknown = dosageValueInput;

    if (typeof dosageValueInput !== 'number') {
      const parsed =
        typeof dosageValueInput === 'string'
          ? Number(dosageValueInput)
          : Number(String(dosageValueInput));

      if (!Number.isNaN(parsed)) {
        dosageValue = parsed;
      }
    }

    return {
      ...record,
      dosageValue,
      dosageOtherDescription: record.dosageOtherDescription ?? undefined,
    };
  }

  private async ensurePetRole(petId: string, userId: string) {
    const role = await this.repository.resolveUserRoleForPet(petId, userId);

    if (!role) {
      throw new HttpError(403, 'FORBIDDEN', 'User has no access to this pet');
    }

    return role;
  }

  async create(userId: string, input: PrescriptionInput) {
    const role = await this.ensurePetRole(input.petId, userId);
    if (role === 'CAREGIVER') {
      ensureRolePermission(role, 'canManageClinicalRecords');
    }

    if (!input.medicationId && !input.medicationName) {
      throw new HttpError(
        422,
        'UNPROCESSABLE_ENTITY',
        'medicationId or medicationName is required',
      );
    }

    if (input.dosageUnit === 'OTHER' && !input.dosageOtherDescription) {
      throw new HttpError(
        422,
        'UNPROCESSABLE_ENTITY',
        'dosageOtherDescription is required when dosageUnit=OTHER',
      );
    }

    let medicationId = input.medicationId;

    if (medicationId) {
      const medication = await this.repository.findMedicationById(medicationId);

      if (!medication) {
        throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Medication not found');
      }

      if (medication.catalogScope === 'TUTOR' && medication.ownerUserId !== userId) {
        throw new HttpError(
          403,
          'FORBIDDEN',
          'Medication does not belong to current tutor',
        );
      }
    } else {
      const medication = await this.repository.findOrCreateTutorMedication({
        name: input.medicationName as string,
        description: input.medicationDescription,
        ownerUserId: userId,
      });

      medicationId = medication.id;
    }

    const created = await this.repository.createPrescription({
      petId: input.petId,
      medicationId,
      dosageValue: input.dosageValue,
      dosageUnit: input.dosageUnit,
      dosageOtherDescription: input.dosageOtherDescription,
      frequencyValue: input.frequencyValue,
      frequencyUnit: input.frequencyUnit,
      startsAt: input.startsAt,
      nextDoseAt: input.startsAt,
      reminderEnabled: input.reminderEnabled ?? true,
      createdByUserId: userId,
    });

    return this.normalizePrescription(created);
  }

  async update(userId: string, prescriptionId: string, input: PrescriptionUpdateInput) {
    const prescription = await this.repository.findPrescriptionById(prescriptionId);

    if (!prescription) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Prescription not found');
    }

    const role = await this.ensurePetRole(prescription.petId, userId);

    if (role === 'CAREGIVER') {
      ensureRolePermission(role, 'canManageClinicalRecords');
    }

    const payload: Record<string, unknown> = {
      reminderEnabled: input.reminderEnabled,
      status: input.status,
      startsAt: input.startsAt,
      frequencyValue: input.frequencyValue,
      frequencyUnit: input.frequencyUnit,
    };

    const startsAt = input.startsAt ?? prescription.startsAt;
    const frequencyValue = input.frequencyValue ?? prescription.frequencyValue;
    const frequencyUnit = input.frequencyUnit ?? prescription.frequencyUnit;

    if (input.startsAt || input.frequencyValue || input.frequencyUnit) {
      payload.nextDoseAt = addFrequency(startsAt, frequencyValue, frequencyUnit);
    }

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );

    const updated = await this.repository.updatePrescription({
      prescriptionId,
      version: input.version,
      payload: sanitizedPayload,
    });

    if (!updated) {
      throw new HttpError(409, 'CONFLICT', 'Prescription version conflict');
    }

    return this.normalizePrescription(updated as Record<string, unknown>);
  }

  async createDoseRecord(
    userId: string,
    prescriptionId: string,
    input: DoseRecordInput,
  ) {
    const prescription = await this.repository.findPrescriptionById(prescriptionId);

    if (!prescription) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Prescription not found');
    }

    const role = await this.ensurePetRole(prescription.petId, userId);
    ensureRolePermission(role, 'canManageDoseRecords');

    if (input.prescriptionVersion !== prescription.version) {
      throw new HttpError(409, 'CONFLICT', 'Prescription version conflict');
    }

    const latestDose = await this.repository.findLatestTakenDose(prescriptionId);
    const isRetroactive = Boolean(
      latestDose && input.takenAt.getTime() < latestDose.takenAt.getTime(),
    );

    const status = isRetroactive ? 'LATE' : 'TAKEN';

    const doseRecord = await this.repository.createDoseRecord({
      prescriptionId,
      petId: prescription.petId,
      scheduledFor: prescription.nextDoseAt,
      takenAt: input.takenAt,
      status,
      isRetroactive,
      notes: input.notes,
      createdByUserId: userId,
    });

    let nextDoseRecalculated = false;

    if (!isRetroactive && status === 'TAKEN') {
      await this.repository.updatePrescriptionNextDose(
        prescriptionId,
        addFrequency(
          input.takenAt,
          prescription.frequencyValue,
          prescription.frequencyUnit,
        ),
      );
      nextDoseRecalculated = true;
    }

    return {
      ...doseRecord,
      nextDoseRecalculated,
    };
  }

  async listAgenda(userId: string, petId: string, date: string) {
    await this.ensurePetRole(petId, userId);

    const from = new Date(`${date}T00:00:00.000Z`);
    const to = new Date(`${date}T23:59:59.999Z`);

    return {
      petId,
      date,
      items: await this.repository.listMedicationAgenda(petId, from, to),
    };
  }
}
