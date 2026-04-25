import { writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import puppeteer, { type Page, type PDFOptions } from "puppeteer";

const MAX_PAGES = 2;
const MIN_SCALE = 0.5;
const SCALE_STEP = 0.02;

const BASE_PDF_OPTIONS: Omit<PDFOptions, "scale" | "path"> = {
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
};

async function renderAtScale(page: Page, scale: number): Promise<Uint8Array> {
  return await page.pdf({ ...BASE_PDF_OPTIONS, scale });
}

async function countPages(pdf: Uint8Array): Promise<number> {
  return (await PDFDocument.load(pdf)).getPageCount();
}

export async function renderPdf(html: string, outPath: string): Promise<void> {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    let scale = 1;
    let pdf = await renderAtScale(page, scale);
    let pages = await countPages(pdf);
    console.log(`PDF at scale ${scale.toFixed(2)}: ${pages} pages`);

    while (pages > MAX_PAGES && scale - SCALE_STEP >= MIN_SCALE - 1e-9) {
      scale = Math.max(MIN_SCALE, scale - SCALE_STEP);
      pdf = await renderAtScale(page, scale);
      pages = await countPages(pdf);
      console.log(`PDF at scale ${scale.toFixed(2)}: ${pages} pages`);
    }

    if (pages > MAX_PAGES) {
      console.warn(`Could not fit within ${MAX_PAGES} pages even at scale ${MIN_SCALE}; using last result (${pages} pages).`);
    }

    writeFileSync(outPath, pdf);
  } finally {
    await browser.close();
  }
}
