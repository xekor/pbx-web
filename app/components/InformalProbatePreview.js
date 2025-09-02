import { getJudicialDistrict } from '../../lib/utahCourts';

export default function InformalProbatePreview({ formData, totalAssetValue }) {
  return (
    <div className="text-sm text-gray-900 flex-1 leading-relaxed">
      {/* Law Firm Header */}
      <div className="mb-6 text-left">
        <div className="text-sm space-y-0 leading-tight">
          <div className="font-medium">[Your Name] ([Bar Number])</div>
          <div>[Law Firm Name]</div>
          <div>[Address Line 1]</div>
          <div>[City], UT [Zip Code]</div>
          <div>([Phone Number])</div>
          <div>[Email Address]</div>
          <div className="mt-2 italic">Attorney for Applicant</div>
        </div>
        <div className="border-b border-gray-400 mt-4 mb-6"></div>
      </div>

      {/* Court Jurisdiction Header */}
      <div className="text-center py-4 mb-6">
        <div className="font-bold">
          IN THE {getJudicialDistrict(formData.domicileCounty).toUpperCase()} JUDICIAL DISTRICT COURT OF{' '}
          <span className="uppercase">{formData.domicileCounty || '[COUNTY]'}</span> COUNTY
        </div>
        <div className="font-bold mt-1">STATE OF UTAH</div>
      </div>

      {/* Estate/Application Section */}
      <div className="mb-8">
        <div className="flex border-t border-b border-gray-400">
          <div className="w-1/2 py-6 border-r border-gray-400 pr-6">
            <div className="font-bold">IN THE MATTER OF THE ESTATE OF</div>
            <div className="mt-6 font-bold uppercase">
              {formData.decedentFullName || '[DECEDENT-NAME]'}
            </div>
            <div className="mt-4">Deceased.</div>
          </div>
          <div className="w-1/2 text-center py-6 pl-6">
            <div className="font-bold">
              APPLICATION FOR {formData.willExists ? 'INFORMAL PROBATE OF WILL AND FOR ' : ''}
              INFORMAL APPOINTMENT OF PERSONAL REPRESENTATIVE
            </div>
            <div className="mt-10">
              Probate No. ____________________
            </div>
          </div>
        </div>
      </div>

      {/* Application Content */}
      <div className="mb-4">
        <span className="font-medium">APPLICANT, </span>
        <span className="font-medium border-b border-gray-300 px-1">
          {formData.affiantFullName || '________________________________'}
        </span>
        <span className="font-medium">, STATES AND REPRESENTS TO THE COURT THAT:</span>
      </div>

      <div className="space-y-3">
        <div className="flex">
          <span className="font-medium mr-2">1.</span>
          <div className="flex-1">
            Applicant&rsquo;s interest in this estate is that of{' '}
            <span className="font-medium border-b border-gray-300 px-1">
              {formData.petitionerRelationship || '__________'}
            </span>{' '}
            of the decedent.
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">2.</span>
          <div className="flex-1">
            The decedent,{' '}
            <span className="font-medium border-b border-gray-300 px-1">
              {formData.decedentFullName || '__________'}
            </span>
            , died on{' '}
            <span className="font-medium border-b border-gray-300 px-1">
              {formData.decedentDodIso ? 
                new Date(formData.decedentDodIso).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : '__________'}
            </span>
            , at the age of{' '}
            <span className="font-medium border-b border-gray-300 px-1">
              __________
            </span>{' '}
            years.
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">3.</span>
          <div className="flex-1">
            Venue is proper because at the time of death the decedent was domiciled in this county.
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">4.</span>
          <div className="flex-1">
            The names and addresses of the spouse, children, heirs, and devisees of the decedent, and the ages of those who are minors so far as known or ascertainable with reasonable diligence by applicant are set forth in Schedule A attached hereto and incorporated by reference.
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">5.</span>
          <div className="flex-1">
            No personal representative has been appointed in this state or elsewhere.
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">6.</span>
          <div className="flex-1">
            Applicant has neither received nor is aware of any demand for notice of any probate or appointment proceeding concerning the decedent that may have been filed in this state or elsewhere.
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">7.</span>
          <div className="flex-1">
            The time limit for informal probate and appointment has not expired because not more than three years have passed since the decedent&rsquo;s death.
          </div>
        </div>

        {formData.willExists ? (
          <>
            <div className="flex">
              <span className="font-medium mr-2">8.</span>
              <div className="flex-1">
                The original of the decedent&rsquo;s will, dated{' '}
                <span className="font-medium border-b border-gray-300 px-1">
                  {formData.willDate || '__________'}
                </span>
                , is in the possession of the Attorney of Record and a copy is attached hereto. To the best of applicant&rsquo;s knowledge, neither that will nor any other will of the decedent has been the subject of a previous probate order.
              </div>
            </div>

            <div className="flex">
              <span className="font-medium mr-2">9.</span>
              <div className="flex-1">
                Applicant believes that the will that is the subject of this application was validly executed.
              </div>
            </div>

            <div className="flex">
              <span className="font-medium mr-2">10.</span>
              <div className="flex-1">
                Having exercised reasonable diligence, applicant is unaware of any instrument revoking the will that is the subject of this application and believes that such will is the decedent&rsquo;s last will.
              </div>
            </div>

            <div className="flex">
              <span className="font-medium mr-2">11.</span>
              <div className="flex-1">
                To the best of applicant&rsquo;s knowledge, the will that is the subject of this application is not part of a known series of testamentary instruments (other than wills or codicils), the latest of which does not expressly revoke the former.
              </div>
            </div>
          </>
        ) : null}

        <div className="flex">
          <span className="font-medium mr-2">{formData.willExists ? '12.' : '8.'}</span>
          <div className="flex-1">
            The person whose appointment as personal representative is sought is applicant. Such person is qualified to act as such and has priority because there is no person with a higher or equal priority for appointment.
            {formData.willExists && (
              <div className="mt-1">
                The person whose appointment as personal representative is sought has priority for appointment as the person nominated in, or pursuant to the exercise of a power conferred by, the decedent's will.
              </div>
            )}
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">{formData.willExists ? '13.' : '9.'}</span>
          <div className="flex-1">
            Bond is not required under U.C.A. § 75-3-603.
          </div>
        </div>
      </div>

      {/* WHEREFORE Section */}
      <div className="mt-6 space-y-3">
        <div className="font-medium">WHEREFORE, APPLICANT REQUESTS THAT:</div>
        
        <div className="flex">
          <span className="font-medium mr-2">1.</span>
          <div className="flex-1">Notice be given as required by law.</div>
        </div>

        {formData.willExists && (
          <div className="flex">
            <span className="font-medium mr-2">2.</span>
            <div className="flex-1">
              The decedent&rsquo;s will, dated{' '}
              <span className="font-medium border-b border-gray-300 px-1">
                {formData.willDate || '__________'}
              </span>
              , be informally probated.
            </div>
          </div>
        )}

        <div className="flex">
          <span className="font-medium mr-2">{formData.willExists ? '3.' : '2.'}</span>
          <div className="flex-1">
            <span className="font-medium border-b border-gray-300 px-1">
              {formData.affiantFullName || '__________'}
            </span>{' '}
            be informally appointed personal representative of the estate of the decedent, to act without bond.
          </div>
        </div>

        <div className="flex">
          <span className="font-medium mr-2">{formData.willExists ? '4.' : '3.'}</span>
          <div className="flex-1">
            Upon qualification and acceptance, letters {formData.willExists ? 'testamentary' : 'of administration'} be issued.
          </div>
        </div>
      </div>

      {/* Signature Section */}
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