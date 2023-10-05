import {
  MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

export type ElementSize = {
  height: number;
  width: number;
};

export type Dimension = keyof ElementSize;

const _useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function _isHtmlElement<T extends keyof HTMLElementTagNameMap>(
  value: unknown
): value is HTMLElementTagNameMap[T] {
  return typeof value === "object" && value instanceof HTMLElement;
}

export function _shouldUpdateSize(
  oldSize: ElementSize,
  newSize: ElementSize,
  dimension?: Dimension
) {
  if (dimension === "height") {
    return oldSize.height !== newSize.height;
  }

  if (dimension === "width") {
    return oldSize.width !== newSize.width;
  }

  return oldSize.height !== newSize.height || oldSize.width !== newSize.width;
}

export function _calculateNewSize(newSize: ElementSize, dimension?: Dimension) {
  const height = dimension !== "width" ? newSize.height : 0;
  const width = dimension !== "height" ? newSize.width : 0;

  return { height, width };
}

export function useElementSize<T>(
  ref: MutableRefObject<T>,
  dimension?: Dimension
) {
  const [size, setSize] = useState({ height: 0, width: 0 });

  const shouldUpdateSize = useCallback(
    (newSize: ElementSize) => _shouldUpdateSize(newSize, size, dimension),
    [dimension, size]
  );

  const calculateNewSize = useCallback(
    (newSize: ElementSize): ElementSize =>
      _calculateNewSize(newSize, dimension),
    [dimension]
  );

  _useIsomorphicLayoutEffect(() => {
    const element = ref.current;

    if (element == null) {
      return;
    }

    if (!_isHtmlElement(element)) {
      console.warn(
        "useElementSize: ref is not an HTML. Cannot compute the size of a non HTML element."
      );
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries.find((item) => item.target === element);
      if (!entry) return;

      const newSize: ElementSize = {
        height: entry.target.clientHeight,
        width: entry.target.clientWidth,
      };

      if (shouldUpdateSize(newSize)) {
        setSize(calculateNewSize(newSize));
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
    };
  }, [calculateNewSize, ref, shouldUpdateSize]);

  return size;
}
