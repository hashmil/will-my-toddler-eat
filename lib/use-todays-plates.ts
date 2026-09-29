import { useSyncExternalStore } from "react";
import { todaysPlates } from "./predict";

const noop = () => () => {};

// Today's favourite and cursed plates depend on the visitor's date, so they only
// exist on the client. The static build renders without them.
export function useTodaysPlates() {
  const client = useSyncExternalStore(noop, () => true, () => false);
  return client ? todaysPlates() : null;
}
