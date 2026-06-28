/**
 * Build a ready-to-render ProseMirror editor element as an HTML string.
 *
 * Using `HTMLProseMirrorElement.create()` (the same path Foundry uses
 * internally) reliably bakes the value/enriched content into the element, which
 * a bare `<prose-mirror value="…">` attribute in a template does not always do
 * — that was the cause of empty description editors.
 *
 * @param {object} options
 * @param {string} options.name        Document field path (e.g. "system.description").
 * @param {string} [options.value]     Raw HTML content to edit.
 * @param {string} [options.enriched]  Enriched HTML for the rendered view.
 * @param {boolean} [options.editable] Whether the editor is editable.
 * @param {Document} [options.document] Document for relative links/enrichment.
 * @returns {string} outerHTML of the configured <prose-mirror> element.
 */
export function proseMirrorHTML({ name, value = "", enriched, editable = true, document } = {}) {
  const element = foundry.applications.elements.HTMLProseMirrorElement.create({
    name,
    value: value ?? "",
    enriched: enriched ?? value ?? "",
    editable,
    toggled: false,
    collaborate: false,
    documentUUID: document?.uuid
  });
  return element.outerHTML;
}
