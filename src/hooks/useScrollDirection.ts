import { useState, useEffect, useRef } from "react";

export function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY.current ? "down" : "up";
      
      // Only hide after scrolling down 50px, show immediately on scroll up
      if (direction === "down" && scrollY > 50 && scrollY - lastScrollY.current > 10) {
        setIsVisible(false);
      } else if (direction === "up" && lastScrollY.current - scrollY > 10) {
        setIsVisible(true);
      }
      
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return isVisible;
}
