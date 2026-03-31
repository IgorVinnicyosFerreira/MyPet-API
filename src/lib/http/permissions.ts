import { HttpError } from './error-handler';

export const rolePermissions = {
  PRIMARY_TUTOR: {
    canDeletePet: true,
    canManageClinicalRecords: true,
    canManageDoseRecords: true,
  },
  CO_TUTOR: {
    canDeletePet: false,
    canManageClinicalRecords: true,
    canManageDoseRecords: true,
  },
  CAREGIVER: {
    canDeletePet: false,
    canManageClinicalRecords: false,
    canManageDoseRecords: true,
  },
} as const;

export type Role = keyof typeof rolePermissions;

export function ensureRolePermission(
  role: Role,
  action: keyof (typeof rolePermissions)[Role],
) {
  const allowed = rolePermissions[role][action];

  if (!allowed) {
    throw new HttpError(403, 'FORBIDDEN', 'Insufficient permission for this action');
  }
}
