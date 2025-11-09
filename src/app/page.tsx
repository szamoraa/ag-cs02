import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-medium text-[#ededed] mb-4">
          Agrilo Schema Builder
        </h1>
        <p className="text-[#a0a0a0] mb-8">
          Build agricultural logic flows with visual schema composition
        </p>
        <Link
          href="/schema-builder"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Open Schema Builder
        </Link>
      </div>
    </div>
  );
}
