import { PolicyDocument } from "@/components/PolicyDocument";
import { REFUND_POLICY } from "@/data/policies";

export const metadata = {
  title: "Refund Policy · Axiom Prep",
  description: "Axiom Prep refund window, request process, and exclusions for mentorship plans.",
};

export default function RefundPage() {
  return <PolicyDocument doc={REFUND_POLICY} />;
}
