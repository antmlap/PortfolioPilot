import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-2">
        This page could not be found.
      </h1>
      <p className="text-mute text-sm mb-6">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-md bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Go to Gator Analyst
      </Link>
    </div>
  );
}
