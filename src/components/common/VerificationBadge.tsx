import type { Verification } from '@/types/legislature';

interface VerificationBadgeProps {
  verification?: Verification;
}

/**
 * Small badge indicating whether a person's profile data is verified against an
 * official government source. An absent `verification` is treated as unverified.
 */
export function VerificationBadge({ verification }: VerificationBadgeProps) {
  const verified = verification?.status === 'verified';

  const title = verified
    ? `Verified${verification?.source ? ` via ${verification.source}` : ''}${
        verification?.lastVerified ? ` (${verification.lastVerified})` : ''
      }`
    : 'Unverified — provenance not yet confirmed against an official source';

  return (
    <span
      className="verification-badge"
      data-verified={verified}
      title={title}
      aria-label={verified ? 'Verified official information' : 'Unverified information'}
    >
      {verified ? '✓ Verified' : 'Unverified'}
    </span>
  );
}
