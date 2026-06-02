import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">404</p>
      <h2 className="text-xl font-semibold mb-2">Page not found</h2>
      <Link href="/" className="btn btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  );
}
