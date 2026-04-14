import { PaginationDto, buildPagination, paginate } from './pagination.dto';

describe('pagination helpers', () => {
  it('defaults page/pageSize to 1/20', () => {
    const dto = new PaginationDto();
    const { skip, take, orderBy } = buildPagination(dto);
    expect(skip).toBe(0);
    expect(take).toBe(20);
    expect(orderBy).toBeUndefined();
  });

  it('computes skip correctly for page 3', () => {
    const dto = new PaginationDto();
    dto.page = 3;
    dto.pageSize = 25;
    expect(buildPagination(dto).skip).toBe(50);
  });

  it('builds an orderBy object from sortBy + sortDir', () => {
    const dto = new PaginationDto();
    dto.sortBy = 'createdAt';
    dto.sortDir = 'asc';
    expect(buildPagination(dto).orderBy).toEqual({ createdAt: 'asc' });
  });

  it('wraps items in a paginated envelope with ceil(total/pageSize)', () => {
    const dto = new PaginationDto();
    dto.page = 2;
    dto.pageSize = 10;
    const r = paginate([1, 2, 3], 23, dto);
    expect(r.items).toEqual([1, 2, 3]);
    expect(r.total).toBe(23);
    expect(r.page).toBe(2);
    expect(r.pageSize).toBe(10);
    expect(r.totalPages).toBe(3);
  });

  it('always reports totalPages >= 1 even with zero results', () => {
    const r = paginate([], 0, new PaginationDto());
    expect(r.totalPages).toBe(1);
  });
});
