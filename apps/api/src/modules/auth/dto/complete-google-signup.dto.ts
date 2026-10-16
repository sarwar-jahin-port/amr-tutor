import { ArrayNotEmpty, ArrayUnique, IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { SELF_REGISTERABLE_ROLES, type SelfRegisterableRole } from './register.dto';

export class CompleteGoogleSignupDto {
  @IsString()
  @IsNotEmpty()
  pendingToken!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(SELF_REGISTERABLE_ROLES, { each: true })
  roles!: SelfRegisterableRole[];
}
