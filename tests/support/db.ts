import { prisma } from '@/lib/prisma';

export async function resetDatabase() {
  await prisma.doseRecords.deleteMany();
  await prisma.prescriptions.deleteMany();
  await prisma.medications.deleteMany();
  await prisma.careRelations.deleteMany();
  await prisma.examAttachments.deleteMany();
  await prisma.exams.deleteMany();
  await prisma.vaccinations.deleteMany();
  await prisma.sanitaryRecords.deleteMany();
  await prisma.weightRecords.deleteMany();
  await prisma.feedingRecords.deleteMany();
  await prisma.consultations.deleteMany();
  await prisma.storedFiles.deleteMany();
  await prisma.pets.deleteMany();
  await prisma.users.deleteMany();
}
