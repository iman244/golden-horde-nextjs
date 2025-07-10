export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-yellow-400 text-lg font-semibold">Loading...</div>
      </div>
    </div>
  );
} 