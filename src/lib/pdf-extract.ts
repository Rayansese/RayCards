import { PDFParse } from "pdf-parse";

const MIN_PAGE_TEXT_LENGTH = 50;

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<{
  pages: ExtractedPdfPage[];
  totalPages: number;
}> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const textResult = await parser.getText();
    const pages: ExtractedPdfPage[] = textResult.pages
      .map((p) => ({
        pageNumber: p.num,
        text: p.text.trim(),
      }))
      .filter((p) => p.text.length >= MIN_PAGE_TEXT_LENGTH);

    return { pages, totalPages: textResult.total };
  } finally {
    await parser.destroy();
  }
}
