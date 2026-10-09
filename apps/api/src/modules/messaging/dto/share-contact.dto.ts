import { IsBoolean } from 'class-validator';

export class ShareContactDto {
  @IsBoolean()
  sharePhone!: boolean;

  @IsBoolean()
  shareEmail!: boolean;
}
