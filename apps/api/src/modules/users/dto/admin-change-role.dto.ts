import { Role } from '@prisma/client';
import { IsIn } from 'class-validator';

const ACTIONS = ['ADD', 'REMOVE'] as const;
export type RoleChangeAction = (typeof ACTIONS)[number];

export class AdminChangeRoleDto {
  @IsIn(Object.values(Role))
  role!: Role;

  @IsIn(ACTIONS)
  action!: RoleChangeAction;
}
