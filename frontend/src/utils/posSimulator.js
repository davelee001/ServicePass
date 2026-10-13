export const SAMPLE_POS_VOUCHERS = [
  { id: 'VOUCH-EDU-8902', label: 'Term 1 Secondary Tuition', balanceCents: 15000, merchant: 'Greenwood Academy (sample)' },
  { id: 'VOUCH-HLTH-4410', label: 'Pediatric Clinic Diagnostics', balanceCents: 10000, merchant: 'St. Jude Health Center (sample)' },
  { id: 'VOUCH-TRN-1209', label: 'Metro Transit Monthly', balanceCents: 5000, merchant: 'Metropolitan Transit (sample)' },
  { id: 'VOUCH-AGRI-7731', label: 'Seed & Fertilizer Grant', balanceCents: 25000, merchant: 'Regional Agro-Dealer (sample)' },
];

export function validateSimulatorAmount(rawAmount, voucherId) {
  const voucher = SAMPLE_POS_VOUCHERS.find(item => item.id === voucherId);
  if (!voucher) return { error: 'Select a valid sample voucher.' };
  const text = String(rawAmount).trim();
  const amount = Number(text);
  if (!text || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'Enter a finite amount greater than zero.' };
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    return { error: 'Enter a dollar amount with at most two decimal places.' };
  }
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || cents > voucher.balanceCents) {
    return { error: `Amount cannot exceed the sample value of $${(voucher.balanceCents / 100).toFixed(2)}.` };
  }
  return { voucher, amount: (cents / 100).toFixed(2) };
}
