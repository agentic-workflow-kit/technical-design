// Seeded violation for the layered (rung-2) case:
// a model must not depend on a controller. Proves the generator emits and enforces
// a NON-hexagonal boundary rule (no-model-to-controller), not just domain/infra.
import { handle } from "../controller/handler";

export const useHandler = (): void => handle();
