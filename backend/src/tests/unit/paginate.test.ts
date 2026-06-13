import { describe, it, expect } from "vitest";
import { parsePaginationParams, buildPaginatedResponse } from "../../lib/paginate";

describe("parsePaginationParams", () => {
  it("returns defaults when query is empty", () => {
    const result = parsePaginationParams({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("parses valid page and limit", () => {
    const result = parsePaginationParams({ page: 3, limit: 50 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it("clamps page to minimum 1 when page is 0", () => {
    const result = parsePaginationParams({ page: 0 });
    expect(result.page).toBe(1);
  });

  it("clamps page to minimum 1 when page is -1", () => {
    const result = parsePaginationParams({ page: -1 });
    expect(result.page).toBe(1);
  });

  it("clamps page to minimum 1 when page is NaN", () => {
    const result = parsePaginationParams({ page: NaN });
    expect(result.page).toBe(1);
  });

  it("clamps page to minimum 1 when page is a non-numeric string", () => {
    const result = parsePaginationParams({ page: "abc" });
    expect(result.page).toBe(1);
  });

  it("clamps limit to maximum 100 when limit is 101", () => {
    const result = parsePaginationParams({ limit: 101 });
    expect(result.limit).toBe(100);
  });

  it("clamps limit to minimum 1 when limit is 0", () => {
    const result = parsePaginationParams({ limit: 0 });
    expect(result.limit).toBe(1);
  });

  it("clamps limit to minimum 1 when limit is -5", () => {
    const result = parsePaginationParams({ limit: -5 });
    expect(result.limit).toBe(1);
  });

  it("falls back to default limit 20 when limit is NaN (not an integer)", () => {
    const result = parsePaginationParams({ limit: NaN });
    expect(result.limit).toBe(20);
  });

  it("accepts limit at the boundary of 1", () => {
    const result = parsePaginationParams({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("accepts limit at the boundary of 100", () => {
    const result = parsePaginationParams({ limit: 100 });
    expect(result.limit).toBe(100);
  });

  it("falls back to default limit 20 when limit is a non-numeric string", () => {
    const result = parsePaginationParams({ limit: "abc" });
    expect(result.limit).toBe(20);
  });
});

describe("buildPaginatedResponse", () => {
  it("computes totalPages correctly for even division", () => {
    const result = buildPaginatedResponse(["a", "b"], 40, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(2);
  });

  it("computes totalPages ceiling for non-even division", () => {
    const result = buildPaginatedResponse(["a"], 21, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(2);
  });

  it("returns totalPages 0 when total is 0", () => {
    const result = buildPaginatedResponse([], 0, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(0);
  });

  it("includes data, page, limit, total in response", () => {
    const data = [{ id: "1" }];
    const result = buildPaginatedResponse(data, 1, { page: 2, limit: 10 });
    expect(result.data).toEqual(data);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(1);
  });

  it("computes totalPages 1 when total equals limit", () => {
    const result = buildPaginatedResponse([], 20, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(1);
  });

  it("computes totalPages 1 when total is 1 and limit is 100", () => {
    const result = buildPaginatedResponse([], 1, { page: 1, limit: 100 });
    expect(result.totalPages).toBe(1);
  });
});
