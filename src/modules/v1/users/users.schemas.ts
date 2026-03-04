import { z } from 'zod/v4-mini';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export { UserSchema };
