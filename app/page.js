'use client';

import Link from 'next/link';
import SmallEstateProcess from './components/SmallEstateProcess';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12">
        <div className="text-center mb-8">
          <Link href="/wizard">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Start Wizard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
