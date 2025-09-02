'use client';

import { useState } from 'react';

export default function DocumentChecklist({ formData, onComplete }) {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const requiredDocuments = [
    {
      id: 'death_cert',
      title: 'Certified Death Certificate',
      description: 'Original or certified copy from the vital records office',
      required: true,
      notes: 'You may need multiple copies for different asset holders'
    },
    {
      id: 'completed_affidavit',
      title: 'Completed Small Estate Affidavit',
      description: 'The form you just completed, printed and ready for signature',
      required: true,
      notes: 'Must be signed in front of a notary public'
    },
    {
      id: 'asset_statements',
      title: 'Asset Documentation',
      description: 'Bank statements, account information, or other proof of assets',
      required: true,
      notes: 'Recent statements showing account balances and deceased person&rsquo;s name'
    },
    {
      id: 'id',
      title: 'Your Government-Issued ID',
      description: 'Driver&rsquo;s license, passport, or other official identification',
      required: true,
      notes: 'Needed for notarization and when presenting affidavit'
    }
  ];

  const conditionalDocuments = [
    {
      id: 'will',
      title: 'Will (if applicable)',
      description: 'Original will or certified copy',
      condition: formData.hasWill === true,
      notes: 'Required if you indicated the deceased had a will'
    },
    {
      id: 'marriage_cert',
      title: 'Marriage Certificate',
      description: 'If claiming as surviving spouse',
      condition: formData.relationshipToDecedent === 'Spouse',
      notes: 'Proves your legal relationship to the deceased'
    },
    {
      id: 'birth_cert',
      title: 'Birth Certificate',
      description: 'If claiming as child or parent',
      condition: ['Child', 'Parent'].includes(formData.relationshipToDecedent),
      notes: 'Proves your legal relationship to the deceased'
    }
  ];

  const filingInstructions = [
    {
      id: 'notarize',
      title: 'Get Affidavit Notarized',
      description: 'Have your signature notarized by a notary public',
      notes: 'Bring your ID and sign in front of the notary - do not sign beforehand'
    },
    {
      id: 'file_court',
      title: 'File with District Court',
      description: `File in ${formData.domicileCounty} County District Court`,
      notes: 'There may be a small filing fee (typically under $50)'
    },
    {
      id: 'present_assets',
      title: 'Present to Asset Holders',
      description: 'Take the filed affidavit to banks, financial institutions, etc.',
      notes: 'They are required to release assets upon presentation of the affidavit'
    }
  ];

  const allRequiredChecked = requiredDocuments.every(doc => checkedItems[doc.id]);
  const allConditionalChecked = conditionalDocuments
    .filter(doc => doc.condition)
    .every(doc => checkedItems[doc.id]);
  const allInstructionsChecked = filingInstructions.every(inst => checkedItems[inst.id]);

  const canProceed = allRequiredChecked && allConditionalChecked && allInstructionsChecked;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Document Checklist & Next Steps
        </h1>
        <p className="text-lg text-gray-600">
          Here&rsquo;s everything you need to complete the small estate affidavit process:
        </p>
      </div>

      <div className="space-y-8">
        {/* Required Documents */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Required Documents
          </h2>
          <div className="space-y-4">
            {requiredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={doc.id}
                  checked={checkedItems[doc.id] || false}
                  onChange={() => toggleCheck(doc.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor={doc.id} className="block">
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{doc.description}</div>
                    {doc.notes && (
                      <div className="text-xs text-blue-600 mt-1 italic">
                        💡 {doc.notes}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conditional Documents */}
        {conditionalDocuments.some(doc => doc.condition) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📄 Additional Documents (Based on Your Situation)
            </h2>
            <div className="space-y-4">
              {conditionalDocuments
                .filter(doc => doc.condition)
                .map((doc) => (
                  <div key={doc.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={doc.id}
                      checked={checkedItems[doc.id] || false}
                      onChange={() => toggleCheck(doc.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor={doc.id} className="block">
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{doc.description}</div>
                        {doc.notes && (
                          <div className="text-xs text-blue-600 mt-1 italic">
                            💡 {doc.notes}
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Filing Instructions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ⚖️ Filing Process Steps
          </h2>
          <div className="space-y-4">
            {filingInstructions.map((instruction, index) => (
              <div key={instruction.id} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={instruction.id}
                  checked={checkedItems[instruction.id] || false}
                  onChange={() => toggleCheck(instruction.id)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor={instruction.id} className="block">
                    <div className="font-medium text-gray-900">
                      Step {index + 1}: {instruction.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{instruction.description}</div>
                    {instruction.notes && (
                      <div className="text-xs text-green-600 mt-1 italic">
                        💡 {instruction.notes}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-medium text-yellow-900 mb-3">📝 Important Notes:</h3>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>• Asset holders have the right to request additional documentation</li>
            <li>• Some institutions may require their own internal forms in addition to the affidavit</li>
            <li>• Keep copies of all documents for your records</li>
            <li>• If any asset holder refuses to honor the affidavit, you may need legal assistance</li>
            <li>• This process typically takes 2-4 weeks after filing</li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">📞 Need Help?</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>{formData.domicileCounty} County District Court:</strong> Contact the court clerk 
              for filing questions and current fee information.
            </p>
            <p>
              <strong>Legal Assistance:</strong> If you encounter complications or resistance from 
              asset holders, consider consulting with a probate attorney.
            </p>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">✅ Progress Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className={`p-3 rounded ${allRequiredChecked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className="font-medium">Required Documents</div>
              <div>{requiredDocuments.filter(d => checkedItems[d.id]).length} of {requiredDocuments.length} complete</div>
            </div>
            <div className={`p-3 rounded ${allConditionalChecked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className="font-medium">Additional Documents</div>
              <div>
                {conditionalDocuments.filter(d => d.condition && checkedItems[d.id]).length} of{' '}
                {conditionalDocuments.filter(d => d.condition).length} complete
              </div>
            </div>
            <div className={`p-3 rounded ${allInstructionsChecked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className="font-medium">Process Steps</div>
              <div>{filingInstructions.filter(i => checkedItems[i.id]).length} of {filingInstructions.length} complete</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onComplete}
            className="flex-1 bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 font-medium"
          >
            ← Back to Form
          </button>
          
          {canProceed && (
            <button
              className="flex-1 bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 font-medium"
            >
              🎉 All Set! Begin Filing Process
            </button>
          )}
        </div>
      </div>
    </div>
  );
}