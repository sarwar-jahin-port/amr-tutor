import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { AdminEducationRecordsController } from './admin-education-records.controller';
import { EducationRecordsController } from './education-records.controller';
import { EducationRecordsService } from './education-records.service';
import { TutorProfileController } from './tutor-profile.controller';
import { TutorProfileService } from './tutor-profile.service';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';

@Module({
  imports: [StorageModule],
  controllers: [
    TutorsController,
    TutorProfileController,
    EducationRecordsController,
    AdminEducationRecordsController,
  ],
  providers: [TutorsService, TutorProfileService, EducationRecordsService],
  exports: [TutorsService, TutorProfileService],
})
export class TutorsModule {}
