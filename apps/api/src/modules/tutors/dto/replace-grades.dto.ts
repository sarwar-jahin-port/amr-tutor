import { ArrayMaxSize, ArrayUnique, IsArray, IsIn } from 'class-validator';
import { GRADE_LEVELS } from '../../reference/data/grades.data';

/** Stage C "Teaching" (ui-ux.md §14). A complete replacement list, not a diff. */
export class ReplaceGradesDto {
  @IsArray()
  @ArrayMaxSize(GRADE_LEVELS.length)
  @ArrayUnique()
  @IsIn(GRADE_LEVELS, { each: true })
  gradeLevels!: string[];
}
