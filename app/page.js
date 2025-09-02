'use client';

import SmallEstateProcess from './components/SmallEstateProcess';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Utah Small Estate Affidavit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete your Small Estate Affidavit for Utah probate
          </p>
        </div>

        <SmallEstateProcess />
      </div>
    </div>
  );
}
