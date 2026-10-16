import { IsOptional, Matches } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @Matches(/^(?:\+?88)?01[3-9]\d{8}$/, {
    message: 'phone must be a valid Bangladesh mobile number',
  })
  phone?: string;
}
