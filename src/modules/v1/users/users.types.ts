export type UserProfile = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserListQuery = {
  name?: string;
};

export type UserUpdatePayload = {
  name?: string;
  email?: string;
};

export type UserActorContext = {
  actorUserId: string;
  actorEmail: string;
  actorRole?: string;
};

export type UserUpdateCommand = {
  targetUserId: string;
  actor: UserActorContext;
  payload: UserUpdatePayload;
};

export type UserDeleteCommand = {
  targetUserId: string;
  actor: UserActorContext;
};
