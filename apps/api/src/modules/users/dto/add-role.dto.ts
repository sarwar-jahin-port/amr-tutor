import { IsIn } from 'class-validator';
import { SELF_REGISTERABLE_ROLES, type SelfRegisterableRole } from '../../auth/dto/register.dto';

export class AddRoleDto {
  @IsIn(SELF_REGISTERABLE_ROLES)
  role!: SelfRegisterableRole;
}
