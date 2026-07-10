import { useEffect, useRef } from 'react';

export default function useFrame(callback: () => void, deps: unknown[]) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    let id: number;
    const tick = () => {
      cbRef.current();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
