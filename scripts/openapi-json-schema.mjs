// OpenAPI 3.0 uses nullable and draft-04 boolean exclusive bounds.
// Normalize these to JSON Schema draft-07 for the runtime validator and HTTP tests.
export function jsonSchema(value) {
  if (Array.isArray(value)) return value.map(jsonSchema);
  if (!value || typeof value !== 'object') return value;
  const converted = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, jsonSchema(child)]));
  for (const [exclusive, bound] of [['exclusiveMinimum', 'minimum'], ['exclusiveMaximum', 'maximum']]) {
    if (typeof converted[exclusive] === 'boolean') {
      if (converted[exclusive]) { converted[exclusive] = converted[bound]; delete converted[bound]; }
      else delete converted[exclusive];
    }
  }
  const nullable = converted.nullable; delete converted.nullable;
  return nullable ? { anyOf: [converted, { type: 'null' }] } : converted;
}
