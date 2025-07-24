import { useEffect, useRef } from "react";

/**
 * A custom hook that logs to the console which prop/state has changed, causing a re-render.
 * This is a debugging tool and should not be used in production.
 *
 * @param name The name of the component being debugged.
 * @param props The props object of the component.
 */
export function useWhyDidYouUpdate(name: string, props: any) {
  // Get a mutable ref to store props for comparison on the next render
  const previousProps = useRef<any>();

  useEffect(() => {
    if (previousProps.current) {
      // Get all keys from previous and current props
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      // Use this object to keep track of changed props
      const changesObj: { [key: string]: { from: any; to: any } } = {};
      // Iterate over keys
      allKeys.forEach((key) => {
        // If previous is different from current
        if (previousProps.current[key] !== props[key]) {
          // Add to changesObj
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      // If changesObj is not empty, log to console
      if (Object.keys(changesObj).length) {
        console.log("[WhyDidYouUpdate]", name, changesObj);
      }
    }

    // Finally, update previousProps to be the current props for the next render
    previousProps.current = props;
  });
} 