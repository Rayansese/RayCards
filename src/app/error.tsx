"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">⚠️</p>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm mb-6 text-slate-400">{error.message}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
