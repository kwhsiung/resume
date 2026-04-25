import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseResume } from "./parseResume.js";
import { renderHtml } from "./renderHtml.js";
import { renderPdf } from "./renderPdf.js";

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const mdPath = resolve(root, "resume.md");
  const htmlPath = resolve(root, "resume.html");
  const pdfPath = resolve(root, "resume.pdf");

  const resume = parseResume(mdPath);
  const html = renderHtml(resume);
  writeFileSync(htmlPath, html);
  console.log(`Wrote ${htmlPath}`);

  await renderPdf(html, pdfPath);
  console.log(`Wrote ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
