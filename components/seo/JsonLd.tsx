/**
 * Structured data, rendered as a plain <script> in the server HTML.
 *
 * Server-rendered on purpose: both workspaces mount with `ssr: false`, so
 * anything a client bundle injected would be invisible to a crawler that
 * doesn't run JS. This ships inside the prerendered document instead.
 */

/** One Schema.org node. `@type` is the only property every node must carry. */
export type JsonLdNode = {
  "@type": string | string[];
  "@id"?: string;
  [key: string]: unknown;
};

/** A `@graph` document: several nodes cross-referenced by `@id`. */
export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
};

export function JsonLd({ id, data }: { id: string; data: JsonLdGraph }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // JSON.stringify does not escape HTML. Encoding `<` means no string in
      // the graph can close the <script> tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
