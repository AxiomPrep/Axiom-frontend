import { PolicyDocument } from "@/components/PolicyDocument";
import { TERMS_POLICY } from "@/data/policies";

export const metadata = {
  title: "Terms and Conditions · Axiom Prep",
  description: "Terms and Conditions for Axiom Prep mentorship enrollment and groups.",
};

export default function TermsPage() {
  return <PolicyDocument doc={TERMS_POLICY} />;
}
