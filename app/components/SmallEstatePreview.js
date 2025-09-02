export default function SmallEstatePreview({ formData, totalAssetValue }) {
  return (
    <div className="text-sm text-gray-900 flex-1 leading-relaxed">
      <div className="text-center mb-6">
        <div className="font-bold text-lg">
          Affidavit for Collecting Personal Property in a Small Estate Proceeding
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Form 1110XX
        </div>
      </div>

      <div className="mb-6 flex">
        <div className="w-1/4">
          <div>State of Utah</div>
          <div>&nbsp;</div>
          <div>County of {formData.domicileCounty || 'Salt Lake'}</div>
        </div>
        <div className="flex-1 ml-4">
          <div>)</div>
          <div>§</div>
          <div>)</div>
        </div>
      </div>

      <div className="mb-4">
        <span className="font-medium">Being first duly sworn, I state that:</span>
      </div>

      <div className="space-y-3">
        <div className="flex">
          <span className="font-medium mr-2">(1)</span>
          <div className="flex-1">
            This affidavit is made for the purpose of collecting the personal property of{' '}
            <span className="font-medium border-b border-gray-300 px-1">
              {formData.decedentFullName || '________________________________'}
            </span>{' '}
            , who died on{' '}
            <span className="font-medium border-b border-gray-300 px-1">
              {formData.decedentDodIso ? 
                new Date(formData.decedentDodIso).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : '__________'}
            </span>{' '}
            , as authorized by Utah Code Section 75-3-1201;
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">(2)</span>
          <div className="flex-1">
            I am the decedent&rsquo;s successor and entitled to payment or delivery of the property;
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">(3)</span>
          <div className="flex-1">
            The value of the entire estate subject to administration, wherever located, less liens and encumbrances, does not exceed $100,000;
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">(4)</span>
          <div className="flex-1">
            30 days have elapsed since the death of the decedent;
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">(5)</span>
          <div className="flex-1">
            No application or petition for the appointment of a personal representative is pending or has been granted in any jurisdiction;
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">(6)</span>
          <div className="flex-1">
            The decedent&rsquo;s successor is entitled to payment or delivery of any indebtedness owed to the decedent, any tangible personal property belonging to the decedent, and any instruments evidencing a debt, obligation, stock, or chose in action belonging to the decedent; and
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">(7)</span>
          <div className="flex-1">
            Such indebtedness, tangible personal property or instrument evidencing a debt, obligation, stock, or chose in action include:
            <div className="mt-2 space-y-1">
              {formData.assetRows.map((asset, index) => (
                <div key={index} className="border-b border-gray-200 pb-1">
                  {asset.holderName && asset.assetDescription ? (
                    <span>{asset.holderName} - {asset.assetDescription} (${parseFloat(asset.valueUsd || 0).toLocaleString()})</span>
                  ) : (
                    <span className="text-gray-400">Asset {index + 1} - Not specified</span>
                  )}
                </div>
              ))}
              {formData.assetRows.length === 0 && (
                <div className="text-gray-400 italic">No assets specified</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="w-64 border-b border-gray-400 h-6"></div>
            <div className="text-xs text-gray-600 mt-1">Date</div>
          </div>
          <div>
            <div className="w-64 border-b border-gray-400 h-6"></div>
            <div className="text-xs mt-1 space-y-1">
              <div>{formData.affiantFullName || 'Name not entered'}</div>
              {formData.affiantAddressLine1 && (
                <div>{formData.affiantAddressLine1}</div>
              )}
              {(formData.affiantAddressCity || formData.affiantAddressState || formData.affiantAddressZip) && (
                <div>
                  {formData.affiantAddressCity}{formData.affiantAddressCity && formData.affiantAddressState ? ', ' : ''}{formData.affiantAddressState} {formData.affiantAddressZip}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs">
          <div className="mb-2">
            On this date, I certify that {formData.affiantFullName} has, while in my present and while under oath or affirmation, voluntarily signed this document and declared that it is true.
          </div>
          <div className="flex justify-between items-end mt-4">
            <div>
              <div className="w-48 border-b border-gray-400 h-6"></div>
              <div className="text-xs text-gray-600 mt-1">Date</div>
            </div>
            <div>
              <div className="w-48 border-b border-gray-400 h-6"></div>
              <div className="text-xs text-gray-600 mt-1">Notary Public</div>
            </div>
          </div>

          <div className="text-center mt-4">
            <div className="border border-gray-400 rounded px-2 py-1 inline-block">
              Notary Seal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}