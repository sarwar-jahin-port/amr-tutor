import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListingSearchQueryDto } from './listing-search-query.dto';

/**
 * Isolated unit coverage of public search-filter validation (blueprint
 * Phase 13 §19.1 "Search filter validation"). Runs class-validator
 * directly against the DTO class — the same pipeline the global
 * ValidationPipe runs in main.ts — with no HTTP/DI involved.
 */
describe('ListingSearchQueryDto', () => {
  async function validateQuery(query: Record<string, unknown>) {
    const dto = plainToInstance(ListingSearchQueryDto, query, { enableImplicitConversion: false });
    return validate(dto);
  }

  it('accepts an empty query (every filter is optional)', async () => {
    expect(await validateQuery({})).toHaveLength(0);
  });

  it('accepts a fully-specified valid query', async () => {
    const errors = await validateQuery({
      city: 'Dhaka',
      area: 'Mirpur',
      subjectId: '11111111-1111-4111-8111-111111111111',
      classLevel: 'CLASS_8',
      salaryMin: 1000,
      salaryMax: 5000,
      daysPerWeek: 3,
      teachingMode: 'HOME',
      sort: 'salary_asc',
      page: 2,
      limit: 50,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID subjectId', async () => {
    const errors = await validateQuery({ subjectId: 'not-a-uuid' });
    expect(errors.some((e) => e.property === 'subjectId')).toBe(true);
  });

  it('rejects a negative salaryMin', async () => {
    const errors = await validateQuery({ salaryMin: -100 });
    expect(errors.some((e) => e.property === 'salaryMin')).toBe(true);
  });

  it('rejects daysPerWeek outside 1-7', async () => {
    expect((await validateQuery({ daysPerWeek: 0 })).some((e) => e.property === 'daysPerWeek')).toBe(true);
    expect((await validateQuery({ daysPerWeek: 8 })).some((e) => e.property === 'daysPerWeek')).toBe(true);
  });

  it('rejects a teachingMode outside the allowed enum', async () => {
    const errors = await validateQuery({ teachingMode: 'HOLOGRAM' });
    expect(errors.some((e) => e.property === 'teachingMode')).toBe(true);
  });

  it('rejects a sort value outside the allowlisted options', async () => {
    const errors = await validateQuery({ sort: 'random' });
    expect(errors.some((e) => e.property === 'sort')).toBe(true);
  });

  it('defaults sort to "newest" when omitted', async () => {
    const dto = plainToInstance(ListingSearchQueryDto, {});
    expect(dto.sort).toBe('newest');
  });

  it('rejects a page size above the shared pagination cap', async () => {
    const errors = await validateQuery({ limit: 101 });
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects an oversized free-text field (city)', async () => {
    const errors = await validateQuery({ city: 'x'.repeat(101) });
    expect(errors.some((e) => e.property === 'city')).toBe(true);
  });
});
