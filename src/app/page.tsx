import Dashboard from "./Dashboard";
import { listBooksWithCounts, serializeBooksForClient } from "@/lib/books";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const books = await listBooksWithCounts();
  return <Dashboard initialBooks={serializeBooksForClient(books)} />;
}
