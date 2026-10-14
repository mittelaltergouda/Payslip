/**
 * JSON-LD block for search engines. It never executes, but it still carries the
 * request CSP nonce so that every inline script on the page follows one rule.
 */
export function StructuredData({ data, nonce }: { data: unknown; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // Escaping < keeps "</script>" inside the data from closing the element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
