import { z } from 'zod';

export const USER_ROLE_VALUES = ['BROKER', 'TRADER', 'SUPERVISOR', 'OPERATIONS'] as const;
export const UserRoleSchema = z.enum(USER_ROLE_VALUES);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: UserRoleSchema,
});

export type User = z.infer<typeof UserSchema>;

export const UsersArraySchema = z.array(UserSchema);

/** Demo desk identities — one per role (no auth in Step 6). */
export const MOCK_USERS: User[] = UsersArraySchema.parse([
  { id: 'user-broker-01', name: 'M. Okonkwo', role: 'BROKER' },
  { id: 'user-trader-01', name: 'A. Chen', role: 'TRADER' },
  { id: 'user-supervisor-01', name: 'S. Patel', role: 'SUPERVISOR' },
  { id: 'user-ops-01', name: 'L. Foster', role: 'OPERATIONS' },
]);

export const DEFAULT_MOCK_USER_ID = 'user-trader-01';

/** Attribution for simulator-generated audit rows (not shown in Acting-as picker). */
export const SIMULATOR_SYSTEM_USER: User = {
  id: 'user-system-simulator',
  name: 'Market Simulator',
  role: 'OPERATIONS',
};
