import type { Static, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

interface StandardIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<{ readonly key: PropertyKey }>;
}

export interface StandardSchema<Input, Output = Input> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) =>
      | { readonly value: Output; readonly issues?: undefined }
      | { readonly issues: ReadonlyArray<StandardIssue> };
    // Optional in the Standard Schema spec, but the type-level slot is what
    // lets consumers (TanStack Form) infer the output type.
    readonly types?: { readonly input: Input; readonly output: Output };
  };
}

// TypeBox 0.34 has no native Standard Schema support — wrap a schema so
// TanStack Form (and anything else speaking Standard Schema) can consume
// the shared TypeBox schemas directly.
export function toStandardSchema<T extends TSchema>(
  schema: T,
): StandardSchema<Static<T>> {
  return {
    "~standard": {
      version: 1,
      vendor: "typebox",
      validate(value: unknown) {
        if (Value.Check(schema, value)) {
          return { value: value as Static<T> };
        }
        const issues = [...Value.Errors(schema, value)].map((error) => ({
          message: error.message,
          path: error.path
            .split("/")
            .filter(Boolean)
            // JSON Pointer segments are strings; array indices must become
            // numbers for consumers that walk state trees by path.
            .map((key) => ({ key: /^\d+$/.test(key) ? Number(key) : key })),
        }));
        return { issues };
      },
    },
  };
}
