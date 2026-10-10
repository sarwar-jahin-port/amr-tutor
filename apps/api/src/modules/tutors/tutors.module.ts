import { Module } from '@nestjs/common';
import { TutorProfileController } from './tutor-profile.controller';
import { TutorProfileService } from './tutor-profile.service';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';

@Module({
  controllers: [TutorsController, TutorProfileController],
  providers: [TutorsService, TutorProfileService],
})
export class TutorsModule {}
