# Data Model - 002-secure-user-management

## Modeling conventions

- Code entities use singular names (`User`, `AuthSession`).
- Database tables use plural names (`Users`).
- User-management persistence is whitelist-only (never persist raw `req.body`).
- API responses never expose sensitive fields (`passwordHash`, raw secrets).
- Protected endpoints use authenticated actor context from JWT payload (`sub`, `email`, optional `role`).

## Entity: User

- Table: `Users`
- Fields:
- `id: uuid` (PK)
- `name: string(3..120)`
- `email: string(5..254, unique)`
- `passwordHash: string` (stored only, never exposed)
- `createdAt: datetime`
- `updatedAt: datetime`
- Relationships:
- 1:N with `Pets` as primary tutor (existing domain relationship)
- 1:N with `CareRelations` as owner/inviter (existing domain relationship)
- Validation rules:
- Email uniqueness must hold on register and update (`409 Conflict` on duplicates).
- Hard delete physically removes row in `Users` table when authorized super admin calls delete endpoint.

## Entity: UserProfileView (read model)

- Type: API response projection from `User`
- Fields:
- `id: string`
- `name: string`
- `email: string`
- `createdAt: datetime`
- `updatedAt: datetime`
- Validation rules:
- Must exclude sensitive attributes (`passwordHash`).
- Returned by register, get-by-id, and update endpoints.

## Entity: UserUpdateRequest (command/input)

- Type: API command payload for `PATCH /v1/users/{userId}`
- Fields:
- `name?: string(3..120)`
- `email?: string(5..254)`
- Validation rules:
- At least one whitelisted field must be provided.
- Non-whitelisted fields are rejected by schema or service validation.
- If `email` changes to an existing user email, operation fails with `409 Conflict`.

## Entity: AuthSession

- Type: API response data for authenticated access
- Fields:
- `token: string`
- `expiresIn: number` (seconds)
- `user: UserProfileView` (used in login contract)
- `user fields + token + expiresIn` flat response for register contract (additive extension)
- Validation rules:
- Token must be generated only after successful user persistence.
- Register flow must preserve existing returned user fields and append auth data.

## Entity: AuthorizationContext

- Type: runtime policy input (not persisted)
- Fields:
- `actorUserId: string` (from JWT `sub`)
- `actorEmail: string` (from JWT `email`)
- `actorRole?: string` (from JWT `role`)
- `targetUserId: string`
- Rule matrix:
- `GET /v1/users/{userId}`: authenticated user (sanitized projection)
- `PATCH /v1/users/{userId}`: allow if `actorUserId == targetUserId` OR `actorRole == SUPER_ADMIN`
- `DELETE /v1/users/{userId}`: allow only if `actorRole == SUPER_ADMIN`

## Entity: UserDeletionOperation

- Type: command for hard delete
- Inputs:
- `targetUserId: string`
- `actorRole: string`
- Outcomes:
- `EXISTS -> DELETED` (success, `204`)
- `MISSING -> NOT_FOUND` (`404`)
- `UNAUTHORIZED_ROLE -> FORBIDDEN` (`403`)
