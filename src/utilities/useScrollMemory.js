import { useLayoutEffect, useRef } from "react";

const storageKey = (key) => `scroll:${key}`;

const readPosition = (key) => {
  try {
    return Number(window.sessionStorage.getItem(storageKey(key))) || 0;
  } catch {
    return 0;
  }
};

const writePosition = (key, top) => {
  try {
    window.sessionStorage.setItem(storageKey(key), String(Math.round(top)));
  } catch {
    // losing the position is harmless
  }
};

// Remembers a scrollable box's position for this tab session, so coming Back
// to a long list lands where you left it instead of at the top. Attach the
// returned ref to the scrolling element; restore waits until `ready` (content
// rendered) because an empty box can't be scrolled.
const useScrollMemory = (key, ready, dependency) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !ready) return undefined;

    element.scrollTop = readPosition(key);

    // Browsers already fire scroll at most once per frame, and a
    // sessionStorage write is cheap, so no extra throttling is needed.
    const onScroll = () => writePosition(key, element.scrollTop);
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => element.removeEventListener("scroll", onScroll);
  }, [key, ready, dependency]);

  return ref;
};

export default useScrollMemory;
