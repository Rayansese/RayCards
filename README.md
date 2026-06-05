
# Raycards 🃏

Turn study paralysis and doomscrolling into high-speed, effortless micro-learning.

## What is Raycards?
Raycards is an AI-powered productivity and educational tool built for every student, regardless of age, academic level, or major. It is a minimalist web application designed to take your heavy, intimidating study materials (supporting PDFs and raw text) and instantly transform them into digestible, interactive flashcards. 

## The Problem: The Psychological Wall of Studying
We all know the exact feeling. You are holding your phone, trapped in a doomscrolling loop, consuming endless short-form content because it requires zero cognitive effort. But the moment you think about opening a 100-page university lecture or a dense textbook, you hit a massive psychological wall. 

The friction to simply *start* is too high. Modern digital habits have wired our brains for quick information delivery, making traditional studying feel like an exhausting chore before you even begin. Students do not lack intelligence; they lack a low-friction starting point. The gap between your phone screen and your PDF textbook is the biggest enemy of productivity today.

## The Solution: Low-Friction AI Flashcards
* **Theoretically:** We defeat doomscrolling by mimicking its core appeal: bite-sized, fast-paced content. If short chunks of information keep you engaged, we make your study material short and fast. Raycards lowers the cognitive friction so starting a study session feels as easy and natural as opening a social media feed.
* **Practically:** You simply paste your text or upload a PDF. Raycards chunks the document, feeds it to a high-speed AI model, and extracts the core concepts to return structured, ready-to-study flashcards. You consume your curriculum piece by piece, bypassing the anxiety of massive text blocks.

## Why This Approach is Better
* **Simpler:** A clear, minimalist flow with no complex configurations. Just upload, generate, and flip cards.
* **Faster:** You bypass the tedious phase of manual reading and highlighting. The AI extracts the vital information immediately so you can start memorizing on minute one.
* **More Efficient:** By using flashcards, the app forces **Active Recall**. Instead of passively reading lines on a page and forgetting them the next day, you actively challenge your brain, which is scientifically proven to build stronger, long-term memory paths.

## How It Works Under the Hood
The architecture is designed for precise data extraction and high-speed processing:
1. **Input:** The user inputs raw text or uploads a study PDF.
2. **Chunking:** The application splits the document into smaller, manageable pages or sections.
3. **AI Generation:** Each chunk is routed to the `gemini-3.1-flash-lite` API (the model architecture is highly modular and easily swappable).
4. **Data Structuring:** The AI model strictly returns the generated flashcards in a clean, structured JSON format.
5. **Storage:** The data is securely and persistently saved to your database via Prisma ORM.

## Tech Stack
* **Framework:** Next.js
* **Database ORM:** Prisma
* **AI Engine:** Google Gemini API (Utilizing Gemini 3.1 Flash Lite)

---

## Getting Started

### Option 1: Live Demo (Recommended)
Experience Raycards instantly without any local setup:
**🔗 [Live Demo: raycards.onrender.com](https://raycards.onrender.com)**

*(Note: The live demo runs on a development-tier Gemini API key, which limits requests to 15 RPM. It successfully processes large files, such as a 100-page book in a few minutes, by respecting these rate limits. In a production environment with a commercial API plan, processing speed is virtually instantaneous.)*

### Option 2: Local Installation
Want to run the project locally on your machine? Follow these steps:

1. Clone this repository to your local system.
2. Install the required dependencies:
```bash
   npm install

```

3. Obtain a free Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
4. Create a `.env` file in the root directory and add your API key along with your Database URL:

```env
   GEMINI_API_KEY=your_key_here
   DATABASE_URL=your_prisma_db_url

```

5. Push the Prisma schema to your database:

```bash
   npx prisma db push

```

6. Start the local development server:

```bash
   npm run dev

```

## Future Roadmap

While Raycards currently handles PDFs and raw text inputs perfectly, the next major evolutionary steps include:

* **Audio and Video Support:** Allowing students to generate flashcards directly from recorded lectures, podcasts, or YouTube tutorials.
* **Infrastructure Scaling:** Expanding the backend capabilities to handle heavier concurrent user loads.
* **Dynamic Study Modes:** Introducing alternative interactive learning methods beyond the classic card flip.



