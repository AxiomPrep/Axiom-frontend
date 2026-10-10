import { PolicyDocument } from "@/components/PolicyDocument";
import { PRIVACY_POLICY } from "@/data/policies";

export const metadata = {
  title: "Privacy Policy · Axiom Prep",
  description: "How Axiom Prep collects, uses, and protects student information.",
};

export default function PrivacyPage() {
  return <PolicyDocument doc={PRIVACY_POLICY} />;
}
