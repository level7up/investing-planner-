import { describe, expect, test } from "vitest";
import { linearScale, nearestIndex, roundedColumnPath, roundedRowPath } from "./geometry";

describe("linearScale", () => {
  test("maps a domain onto a range", () => {
    const scale = linearScale([0, 100], [200, 0]);
    expect(scale(0)).toBe(200);
    expect(scale(50)).toBe(100);
    expect(scale(100)).toBe(0);
  });

  test("puts a flat domain in the middle of the range", () => {
    expect(linearScale([5, 5], [0, 100])(5)).toBe(50);
  });
});

describe("nearestIndex", () => {
  test("finds the closest position", () => {
    expect(nearestIndex([0, 10, 30], 18)).toBe(1);
    expect(nearestIndex([0, 10, 30], 25)).toBe(2);
    expect(nearestIndex([], 5)).toBe(-1);
  });
});

describe("roundedColumnPath", () => {
  test("rounds the top of a positive column and keeps the baseline square", () => {
    expect(roundedColumnPath(10, 20, 100, 40)).toBe("M10,100 L10,44 Q10,40 14,40 L26,40 Q30,40 30,44 L30,100 Z");
  });

  test("rounds the bottom of a negative column", () => {
    expect(roundedColumnPath(10, 20, 100, 140)).toBe("M10,100 L10,136 Q10,140 14,140 L26,140 Q30,140 30,136 L30,100 Z");
  });

  test("returns an empty path for zero height", () => {
    expect(roundedColumnPath(10, 20, 100, 100)).toBe("");
  });
});

describe("roundedRowPath", () => {
  test("rounds the far end of a positive bar", () => {
    expect(roundedRowPath(50, 10, 16, 120)).toBe("M50,10 L116,10 Q120,10 120,14 L120,22 Q120,26 116,26 L50,26 Z");
  });

  test("rounds the far end of a negative bar", () => {
    expect(roundedRowPath(50, 10, 16, 20)).toBe("M50,10 L24,10 Q20,10 20,14 L20,22 Q20,26 24,26 L50,26 Z");
  });
});
