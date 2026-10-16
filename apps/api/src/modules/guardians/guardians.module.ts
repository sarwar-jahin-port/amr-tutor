import { Module } from '@nestjs/common';
import { GuardianProfileController } from './guardian-profile.controller';
import { GuardianProfileService } from './guardian-profile.service';

@Module({
  controllers: [GuardianProfileController],
  providers: [GuardianProfileService],
  exports: [GuardianProfileService],
})
export class GuardiansModule {}
