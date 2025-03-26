import { TokenCreator } from "@/components/token-creator"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-purple-300 mb-2">میم‌ساز!</h1>
          <p className="text-lg text-gray-400">ایجاد میم‌کوین بر بستر زنجیر</p>
        </div>

        <TokenCreator />
      </div>
    </main>
  )
}

