'use client';

export default function Results({ result, onRestart }) {
  const renderNoProbateNeeded = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-xl font-semibold text-green-900">Good news! You likely don&rsquo;t need probate.</h2>
          </div>
        </div>
        
        <div className="text-green-700 space-y-3">
          <p>
            Since all assets were jointly owned or had named beneficiaries, they should transfer 
            automatically without going through probate court.
          </p>
          
          <div className="bg-white p-4 rounded border">
            <h3 className="font-medium text-green-900 mb-2">Next steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Contact banks/financial institutions with death certificate</li>
              <li>Update account names or claim beneficiary assets</li>
              <li>Consider consulting an attorney if you encounter complications</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button
          onClick={onRestart}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Start over with different information
        </button>
      </div>
    </div>
  );

  const renderSmallEstate = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-xl font-semibold text-blue-900">Small Estate Affidavit</h2>
          </div>
        </div>
        
        <div className="text-blue-700 space-y-3">
          <p>
            You qualify for Utah&rsquo;s simplified small estate process! This is faster and less expensive than full probate.
          </p>
          
          <div className="bg-white p-4 rounded border">
            <h3 className="font-medium text-blue-900 mb-2">Requirements met:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Assets under $100,000</li>
              <li>No real estate</li>
              <li>At least 30 days since death</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-medium text-blue-900 mb-2">Next steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Gather required documents (death certificate, asset information)</li>
              <li>Complete Small Estate Affidavit form</li>
              <li>File with the district court in the county where deceased lived</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <button 
          onClick={() => result.onContinueSmallEstate && result.onContinueSmallEstate()}
          className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700"
        >
          Continue with Small Estate Process
        </button>
        <div className="text-center">
          <button
            onClick={onRestart}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );

  const renderFullProbate = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-xl font-semibold text-amber-900">Full Probate Required</h2>
          </div>
        </div>
        
        <div className="text-amber-700 space-y-3">
          <p>
            Based on your answers, you&rsquo;ll need to go through the full probate process in Utah.
          </p>
          
          <div className="bg-white p-4 rounded border">
            <h3 className="font-medium text-amber-900 mb-2">Why full probate is required:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.reason === 'real_property_over_threshold' && <li>Estate includes real estate</li>}
              {result.reason === 'over_threshold' && <li>Assets exceed $100,000</li>}
            </ul>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-medium text-amber-900 mb-2">Next steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Consider consulting with a probate attorney</li>
              <li>Gather all estate documents and asset information</li>
              <li>Determine if there was a will and if it&rsquo;s valid</li>
              <li>Identify all heirs and beneficiaries</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <button className="w-full bg-amber-600 text-white p-4 rounded-lg hover:bg-amber-700">
          Continue with Full Probate Process
        </button>
        <div className="text-center">
          <button
            onClick={onRestart}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );

  const renderWaitOrFullProbate = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-xl font-semibold text-yellow-900">You Have Options</h2>
          </div>
        </div>
        
        <div className="text-yellow-700 space-y-4">
          <p>
            Since it&rsquo;s been less than 30 days since the death, you can either wait to use 
            the small estate process or proceed with full probate now.
          </p>
          
          <div className="grid gap-4">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-yellow-900 mb-2">Option 1: Wait for Small Estate (Recommended)</h3>
              <p className="text-sm mb-2">Wait until 30 days have passed, then use the simplified process.</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-yellow-600">
                <li>Faster and less expensive</li>
                <li>Less paperwork required</li>
                <li>No court supervision needed</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-yellow-900 mb-2">Option 2: Start Full Probate Now</h3>
              <p className="text-sm mb-2">Begin the formal probate process immediately.</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-yellow-600">
                <li>Can start immediately</li>
                <li>More oversight and protection</li>
                <li>Required if there are disputes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <button className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700">
          I&rsquo;ll wait for small estate process
        </button>
        <button className="w-full bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700">
          Start full probate now
        </button>
        <div className="text-center">
          <button
            onClick={onRestart}
            className="text-yellow-600 hover:text-yellow-700 font-medium"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );

  if (!result.needsProbate) {
    return renderNoProbateNeeded();
  }

  switch (result.path) {
    case 'small_estate':
      return renderSmallEstate();
    case 'full_probate':
      return renderFullProbate();
    case 'wait_or_full_probate':
      return renderWaitOrFullProbate();
    default:
      return renderFullProbate();
  }
}