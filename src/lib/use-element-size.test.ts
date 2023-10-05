import { renderHook } from "@testing-library/react";
import {
  Dimension,
  _calculateNewSize,
  _shouldUpdateSize,
  useElementSize,
} from "./use-element-size";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe(_shouldUpdateSize, () => {
  test.each(["height", "width", undefined])(
    "dimension %s ->  same values (shouldn't calculate)",
    (dimension) => {
      const oldSize = { height: 100, width: 100 };
      const newSize = { height: 100, width: 100 };
      expect(_shouldUpdateSize(oldSize, newSize, dimension as Dimension)).toBe(
        false
      );
    }
  );

  test.each([
    { dimension: "height", newSize: { height: 200, width: 100 } },
    { dimension: "width", newSize: { height: 100, width: 200 } },
    { newSize: { height: 100, width: 200 } },
  ])(
    "dimension $dimension -> selected value changed (should calculate)",
    ({ newSize, dimension }) => {
      const oldSize = { height: 100, width: 100 };
      expect(_shouldUpdateSize(oldSize, newSize, dimension as Dimension)).toBe(
        true
      );
    }
  );

  test.each([
    { dimension: "height", newSize: { height: 100, width: 200 } },
    { dimension: "width", newSize: { height: 200, width: 100 } },
  ])(
    "dimension $dimension -> inverted value changed (shouldn't calculate)",
    ({ newSize, dimension }) => {
      const oldSize = { height: 100, width: 100 };
      expect(_shouldUpdateSize(oldSize, newSize, dimension as Dimension)).toBe(
        false
      );
    }
  );
});

describe(_calculateNewSize, () => {
  test("dimension height -> pick new height and use 0 for width", () => {
    const newSize = { height: 200, width: 100 };

    expect(_calculateNewSize(newSize, "height")).toEqual({
      height: newSize.height,
      width: 0,
    });
  });

  test("dimension width -> pick new width and use 0 for height", () => {
    const newSize = { height: 100, width: 200 };

    expect(_calculateNewSize(newSize, "width")).toEqual({
      height: 0,
      width: newSize.width,
    });

    test("dimension undefined -> pick new width and height", () => {
      const newSize = { height: 100, width: 200 };
      expect(_calculateNewSize(newSize)).toEqual(newSize);
    });
  });
});

describe(useElementSize, () => {
  const mockObserver = vi.fn(() => new ResizeObserverMock());
  const actualImplementation = global.ResizeObserver;

  beforeAll(() => {
    global.ResizeObserver = mockObserver;
  });

  afterAll(() => {
    global.ResizeObserver = actualImplementation;
    vi.clearAllMocks();
  });

  test("set ResizeObserver for HTMLElements", () => {
    const ref = { current: document.createElement("div") };
    const spyOnObserve = vi.spyOn(ResizeObserverMock.prototype, "observe");

    renderHook(() => useElementSize(ref));

    expect(spyOnObserve).toHaveBeenCalledOnce();
  });

  test("don't set ResizeObserver for non-HTMLElements", () => {
    const ref = { current: 0 };
    const spyOnWarn = vi.spyOn(console, "warn");
    const spyOnObserve = vi.spyOn(ResizeObserverMock.prototype, "observe");

    renderHook(() => useElementSize(ref));

    expect(spyOnObserve).not.toHaveBeenCalled();
    expect(spyOnWarn).toHaveBeenCalledOnce();
  });

  test("don't set ResizeObserver for nullable refs", () => {
    const ref = { current: null };
    const spyOnObserve = vi.spyOn(ResizeObserverMock.prototype, "observe");

    renderHook(() => useElementSize(ref));

    expect(spyOnObserve).not.toHaveBeenCalled();
  });

  test("stop observing on unmount", () => {
    const ref = { current: document.createElement("div") };
    const spyOnUnobserve = vi.spyOn(ResizeObserverMock.prototype, "unobserve");

    const { unmount } = renderHook(() => useElementSize(ref));

    unmount();

    expect(spyOnUnobserve).toHaveBeenCalledOnce();
  });
});
