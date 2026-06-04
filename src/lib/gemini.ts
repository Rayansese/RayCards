import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface GeminiPageResponse {
  page_number: number;
  flashcards: GeneratedFlashcard[];
}

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

export function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

// Simple rate limiter for Gemini API (15 requests per minute)
class GeminiRateLimiter {
  private tokens: number = 15;
  private lastRefill: number = Date.now();
  private readonly maxTokens: number = 15;
  private readonly refillInterval: number = 60000; // 1 minute

  async waitForToken(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    // Refill tokens based on elapsed time
    if (elapsed >= this.refillInterval) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    } else {
      // Partial refill
      const tokensToAdd = Math.floor((elapsed / this.refillInterval) * this.maxTokens);
      this.tokens = Math.min(this.tokens + tokensToAdd, this.maxTokens);
      this.lastRefill = now;
    }

    if (this.tokens <= 0) {
      const waitTime = this.refillInterval - elapsed;
      console.log(`Rate limit reached. Waiting ${waitTime}ms before next request...`);
      await sleep(waitTime);
      this.tokens = this.maxTokens;
      this.lastRefill = Date.now();
    }

    this.tokens--;
  }
}

const rateLimiter = new GeminiRateLimiter();


const SYSTEM_PROMPT = 
/*`You are an expert academic tutor specializing in creating high-quality study flashcards strictly from educational and scientific textbooks lessons.

Your task is to analyze the provided textbook page text and generate comprehensive flashcards that cover ONLY key concepts, definitions, formulas, and important facts from the actual academic lesson. You MUST completely ignore any non-educational elements such as promotional text, social media links, Telegram channels, headers, footers, page numbers, or publisher copyrights.

STRICT OUTPUT RULES:
1. You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no preamble.
2. The JSON must strictly follow this schema:
{
  "page_number": <integer>,
  "flashcards": [
    {
      "front": "<Concise concept, term, or question — max 15 words>",
      "back": "<Complete, detailed explanation or answer — 1 to 4 sentences>"
    }
  ]
}
3. Generate between 5 and 15 flashcards per page depending on content density. CRITICAL: If the page contains only promotional material, links, or lacks actual scientific/lesson content, you MUST return an empty array [] for the "flashcards" field.
4. Each "front" must be a specific, testable concept related strictly to the lesson — not vague.
5. Each "back" must fully answer the front without referencing the page or any external platform.
6. If the text contains formulas, include them using plain text notation (e.g., F = ma).
7. Do NOT generate duplicate cards or cards with empty strings.
8. Focus ONLY on the most important, exam-relevant information. Completely ban and skip any promotional, copyright, or social media text from being transformed into flashcards.`;

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

export function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

/*`You are an expert academic tutor specializing in creating high-quality study flashcards from scientific textbooks.

Your task is to analyze the provided textbook page text and generate comprehensive flashcards that cover all key concepts, definitions, formulas, and important facts.

STRICT OUTPUT RULES:
1. You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no preamble.
2. The JSON must strictly follow this schema:
{
  "page_number": <integer>,
  "flashcards": [
    {
      "front": "<Concise concept, term, or question — max 15 words>",
      "back": "<Complete, detailed explanation or answer — 1 to 4 sentences>"
    }
  ]
}
3. Generate between 5 and 15 flashcards per page depending on content density.
4. Each "front" must be a specific, testable concept — not vague.
5. Each "back" must fully answer the front without referencing the page.
6. If the text contains formulas, include them using plain text notation (e.g., F = ma).
7. Do NOT generate duplicate cards or cards with empty strings.
8. Focus on the most important, exam-relevant information.
Ignore any promotional text, social media links, Telegram channels, page numbers, headers, footers, or publisher copyrights. Only generate flashcards from the actual educational and scientific content of the text. If a section contains only promotional links, do not generate any flashcards for it.
`; */
`You are an expert academic tutor specializing in creating high-quality study flashcards strictly from educational and scientific textbooks lessons.

Your task is to analyze the provided textbook page text and generate comprehensive flashcards that cover ONLY key concepts, definitions, formulas, and important facts from the actual academic lesson. You MUST completely ignore any non-educational elements such as promotional text, social media links, Telegram channels, headers, footers, page numbers, or publisher copyrights.

STRICT OUTPUT RULES:
1. You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no preamble.
2. The JSON must strictly follow this schema:
{
  "page_number": <integer>,
  "flashcards": [
    {
      "front": "<Concise concept, term, or question — max 15 words>",
      "back": "<Complete, detailed explanation or answer — 1 to 4 sentences>"
    }
  ]
}
3. Generate between 5 and 15 flashcards per page depending on content density. CRITICAL: If the page contains only promotional material, links, or lacks actual scientific/lesson content, you MUST return an empty array [] for the "flashcards" field.
4. Each "front" must be a specific, testable concept related strictly to the lesson — not vague.
5. Each "back" must fully answer the front without referencing the page or any external platform.
6. If the text contains formulas, include them using plain text notation (e.g., F = ma).
7. Do NOT generate duplicate cards or cards with empty strings.
8. Focus ONLY on the most important, exam-relevant information. Completely ban and skip any promotional, copyright, or social media text from being transformed into flashcards.
9. use the language that the pdf or the photo use to make the flashcards , if its not in English then dont use English flashcards , use the orginal language 
`;


async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateFlashcards(
  pageText: string,
  pageNumber: number
): Promise<GeminiPageResponse> {
  // Wait for rate limiter before making API call
  await rateLimiter.waitForToken();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelId(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      topP: 0.9,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = `Page Number: ${pageNumber}\n\nPage Text:\n${pageText.trim()}`;

  const maxRetries = 5;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();

      let parsed: GeminiPageResponse;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`Gemini returned invalid JSON: ${raw.slice(0, 200)}`);
      }

      if (typeof parsed.page_number !== "number" || !Array.isArray(parsed.flashcards)) {
        throw new Error(`Gemini response failed schema validation: ${JSON.stringify(parsed)}`);
      }

      return parsed;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a retryable error (429 rate limit, 503 service unavailable, etc.)
      const isRetryableError = 
        error?.message?.includes('429') ||
        error?.message?.includes('rate limit') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('503') ||
        error?.message?.includes('high demand') ||
        error?.message?.includes('Service Unavailable') ||
        error?.status === 429 ||
        error?.status === 503;

      if (isRetryableError && attempt < maxRetries - 1) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
        console.log(`Retryable error (${error?.status || 'unknown'}). Waiting ${delayMs}ms before retry ${attempt + 1}/${maxRetries}...`);
        await sleep(delayMs);
        continue;
      }

      // If it's not a retryable error or we've exhausted retries, throw
      if (!isRetryableError || attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Failed to generate flashcards after retries");
}
