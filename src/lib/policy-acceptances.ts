import { POLICY_VERSION } from "@/data/policies";

export type PolicyAcceptance = {
  id: string;
  acceptedAt: string;
  policyVersion: string;
  termsAccepted: boolean;
  refundAccepted: boolean;
  privacyAcknowledged: boolean;
  email: string;
  name: string;
  userId: string | null;
  planId: string | null;
  planName: string | null;
  track: string | null;
  userAgent: string | null;
  ip: string | null;
};

export { POLICY_VERSION };
