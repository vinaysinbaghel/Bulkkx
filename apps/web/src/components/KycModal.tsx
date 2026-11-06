import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { SimulatedKycVerificationAdapter } from '@bulkkx/adapters';

interface KycModalProps {
  onClose: () => void;
  onKycCompleted: (partyData: any) => void;
  initialParty?: any;
}

export const KycModal: React.FC<KycModalProps> = ({ onClose, onKycCompleted, initialParty }) => {
  const [legalName, setLegalName] = useState(initialParty?.legalName || '');
  const [gstin, setGstin] = useState(initialParty?.gstin || '24AAACB9021F1ZX');
  const [pan, setPan] = useState(initialParty?.pan || 'AAACB9021F');
  const [accountNumber, setAccountNumber] = useState('501004812901');
  const [ifscCode, setIfscCode] = useState('HDFC0001890');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const kycAdapter = new SimulatedKycVerificationAdapter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const gstRes = await kycAdapter.verifyGst(gstin);
      if (!gstRes.valid) {
        throw new Error('Invalid GSTIN format. Expected 15-character Indian GST format (e.g. 24AAACB9021F1ZX)');
      }

      const panRes = await kycAdapter.verifyPan(pan);
      if (!panRes.valid) {
        throw new Error('Invalid PAN number. Expected 10-character alphanumeric PAN (e.g. AAACB9021F)');
      }

      const bankRes = await kycAdapter.verifyBankAccount(accountNumber, ifscCode);
      if (!bankRes.valid) {
        throw new Error('Invalid bank account or 11-character IFSC code.');
      }

      setSuccess(true);
      setTimeout(() => {
        onKycCompleted({
          legalName,
          gstin,
          pan,
          bankDetails: {
            accountNumber: `••••••••${accountNumber.slice(-4)}`,
            ifscCode,
            bankName,
          },
          kycStatus: 'verified',
        });
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'KYC Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e6f9f4] flex items-center justify-center text-[#00d09c]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#141b29]">Trade KYC & Settlement Bank Check</h3>
              <p className="text-[11px] text-gray-500">Automated verification via GSTN & MCA sandbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#00d09c] mx-auto animate-bounce" />
            <h4 className="font-bold text-[#141b29] text-base">KYC Verified Successfully!</h4>
            <p className="text-xs text-gray-500">GST, PAN and Settlement bank account confirmed.</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Enterprise Legal Name</label>
              <input
                type="text"
                required
                value={legalName}
                placeholder="e.g. Shree Balaji Agro Traders Pvt Ltd"
                onChange={(e) => setLegalName(e.target.value)}
                className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00d09c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">GSTIN (15 Digits)</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#00d09c]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">PAN (10 Digits)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#00d09c]"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8fafd] border border-gray-200 space-y-3">
              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#00d09c]" />
                <span>Settlement Bank Account</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 font-medium">Account Number</label>
                  <input
                    type="password"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#00d09c]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 font-medium">IFSC Code</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="mt-1 w-full bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#00d09c]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="px-5 py-2.5 rounded-full font-bold text-xs bg-[#00d09c] hover:bg-[#00b386] text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {verifying ? 'Verifying with GSTN...' : 'Verify & Activate Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
