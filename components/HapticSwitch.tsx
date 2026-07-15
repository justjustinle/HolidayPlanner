'use client';

import { useEffect, useRef } from 'react';
import { registerHapticSwitch } from '@/lib/motion';

/**
 * Mounts a display:none iOS 17.4+ checkbox switch so `hapticTick()` can
 * programmatically click it for a native haptic. Harmless elsewhere.
 */
export default function HapticSwitch() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      // React may not pass the non-standard `switch` attribute through props.
      el.setAttribute('switch', '');
    }
    registerHapticSwitch(el);
    return () => registerHapticSwitch(null);
  }, []);

  return (
    <input
      ref={ref}
      type="checkbox"
      tabIndex={-1}
      aria-hidden
      style={{ display: 'none' }}
    />
  );
}
