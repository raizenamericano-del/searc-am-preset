export type ProviderErrorKind = "timeout" | "blocked" | "rate_limited" | "not_found" | "bad_response" | "network" | "unsupported" | "upstream";

/** Normalised provider failure — routes map `kind` to an HTTP status. */
export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  /** Safe-to-show message (no internals). */
  readonly publicMessage: string;

  constructor(kind: ProviderErrorKind, publicMessage: string, internal?: string) {
    super(internal ?? publicMessage);
    this.name = "ProviderError";
    this.kind = kind;
    this.publicMessage = publicMessage;
  }
}

export function isProviderError(err: unknown): err is ProviderError {
  return err instanceof ProviderError;
}
