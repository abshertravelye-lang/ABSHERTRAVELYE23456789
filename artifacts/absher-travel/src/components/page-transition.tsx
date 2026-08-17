import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

/**
 * Wraps router children in a smooth fade+slide transition.
 * Uses CSS only — no extra dependencies.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const prevLocation = useRef(location);
  const pendingChildren = useRef(children);

  useEffect(() => {
    pendingChildren.current = children;

    if (location === prevLocation.current) {
      setDisplayed(children);
      return;
    }

    prevLocation.current = location;
    setPhase("out");

    const t1 = setTimeout(() => {
      setDisplayed(pendingChildren.current);
      setPhase("in");
    }, 120);

    const t2 = setTimeout(() => {
      setPhase("idle");
    }, 280);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const style: React.CSSProperties =
    phase === "out"
      ? { opacity: 0, transform: "translateY(6px)", transition: "opacity 120ms ease, transform 120ms ease" }
      : phase === "in"
      ? { opacity: 0, transform: "translateY(6px)", transition: "none" }
      : { opacity: 1, transform: "translateY(0)", transition: "opacity 180ms ease, transform 180ms ease" };

  return <div style={style}>{displayed}</div>;
}
