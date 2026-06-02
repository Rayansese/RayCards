export default function Loading() {
  return (
    <div className="flex flex-col gap-6 py-12">
      <div className="skeleton h-10 w-72 rounded mx-auto" />
      <div className="skeleton h-48 w-full max-w-2xl rounded-2xl mx-auto" />
    </div>
  );
}
