import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

/** Stage C "Teaching" (ui-ux.md §14). A complete replacement list, not a diff. */
export class ReplaceSubjectsDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  subjectIds!: string[];
}
