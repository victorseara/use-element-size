import { useEffect, useRef, useState } from "react";
import { useElementSize } from "./lib/use-element-size";

function simulateAsync<T>(cb: () => T, timeout: number) {
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(cb());
    }, timeout);
  });
}

const fillArray = (lenght: number) =>
  Array.from({ length: lenght }, (_, i) => i + 1);

export default function App() {
  const [state, setState] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rootSize = useElementSize(rootRef);

  const simulateFetch = async () => {
    const data = await simulateAsync(() => fillArray(1000), 300);
    setState(data);
  };

  useEffect(() => {
    simulateFetch();
  }, []);

  return (
    <div ref={rootRef} className="root">
      <h1 className="heading-1">Root Size: {JSON.stringify(rootSize)}</h1>
      <ul className="list">
        {state.map((item) => (
          <li className="list-item" key={item}>
            Item {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
