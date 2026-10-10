/** Policy version stamped on every acceptance record. Bump when legal text changes. */
export const POLICY_VERSION = "2026-10-10";
export const POLICY_LAST_UPDATED = "10 October 2026";

export type PolicySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PolicyDoc = {
  id: "terms" | "refund" | "privacy";
  title: string;
  href: string;
  intro: string;
  sections: PolicySection[];
};

export const TERMS_POLICY: PolicyDoc = {
  id: "terms",
  title: "Terms and Conditions",
  href: "/terms",
  intro:
    'Welcome to Axiom Prep ("Axiom Prep", "we", "us"). By paying for a plan or joining any of our mentor groups, you ("student") agree to these Terms and Conditions. Please read them carefully before enrolling.',
  sections: [
    {
      heading: "1. About Axiom Prep",
      paragraphs: [
        "Axiom Prep runs mentorship programs for NEET UG and IIT JEE aspirants. Students join a small group of about 25-30 aspirants, guided by mentors and educators through a WhatsApp group, weekly group calls and doubt-solving support.",
        "Our website is https://axiomprepedu.netlify.app/ and our support email is team.axiomprep8118@gmail.com.",
      ],
    },
    {
      heading: "2. Plans and early bird seats",
      bullets: [
        "NEET UG: Gold Plan and Platinum Plan. IIT JEE: Gold Plan and Diamond Plan.",
        "The features of each plan are those shown on our brochures and website at the time of purchase.",
        "Early bird prices are available only for a limited number of seats: the first 35 students for the Gold Plan and the first 15 students for the Platinum Plan (NEET) and the Diamond Plan (IIT JEE). Once these seats are filled, the early bird price ends and prices may change.",
        "Some NEET mentor groups are available only on specific plans, as shown in our brochure.",
      ],
    },
    {
      heading: "3. Enrollment and payment",
      bullets: [
        "Payments are made directly by UPI or bank transfer, using the payment details given by Axiom Prep.",
        "After paying, the student shares their name, email, WhatsApp number and payment proof (such as a screenshot or transaction ID) with us.",
        "Enrollment is confirmed once we verify the payment. The student is then added to the WhatsApp group with their mentors.",
        "Please pay only to the payment details shared by the official Axiom Prep team.",
      ],
    },
    {
      heading: "4. What students receive",
      bullets: [
        "Gold Plan (NEET and JEE): WhatsApp group with mentors, guidance-related doubts solved by mentors, sharing of daily targets and updates, a small group of 25-30 aspirants, weekly group meet call, and help with study strategy, planning, time management and consistency.",
        "Platinum Plan (NEET) and Diamond Plan (JEE): everything in Gold, plus 2 one-to-one calls with a mentor (5 minutes each), academic doubt solving, live doubt-solving by educators, and short 30-minute lectures on the most-doubted concepts. The Diamond Plan also includes exclusive question banks.",
        "Lectures are shared with students on YouTube.",
        "Students can ask their doubts, and we aim to respond within 2 to 3 working days.",
      ],
    },
    {
      heading: "5. Plan upgrade",
      paragraphs: [
        "A student can upgrade to a higher plan at any time by paying only the price difference between the two plans.",
      ],
    },
    {
      heading: "6. Student conduct and removal from the group",
      paragraphs: [
        "Our groups are a respectful space for learning. The following are not allowed:",
      ],
      bullets: [
        "Spamming the group.",
        "Abusive language or abusing anyone.",
        "Posting anything inappropriate or wrong.",
        "Demeaning any religion or belief.",
        "Disrespecting mentors, educators or other students.",
        "Any other misconduct that disturbs the group.",
        "For any such mistake, the student will be given 2 warnings. After that, the student will be removed from the group. A student who is removed for breaking these rules is not eligible for a refund.",
      ],
    },
    {
      heading: "7. Refunds",
      paragraphs: [
        "Refunds are handled as described in our Refund Policy, which is part of these Terms.",
      ],
    },
    {
      heading: "8. Use of content",
      paragraphs: [
        "Lectures, recordings, question banks and other material shared by Axiom Prep are for the personal use of the enrolled student. They must not be copied, resold or shared publicly without our permission.",
      ],
    },
    {
      heading: "9. No guarantee of results",
      paragraphs: [
        "Axiom Prep provides guidance, planning and doubt-solving support. Exam results depend on the student's own effort and many other factors, so we do not guarantee any rank, score or selection. Mentor achievements shown on our brochures and posters are as reported by the mentors.",
      ],
    },
    {
      heading: "10. Changes to schedule or mentors",
      paragraphs: [
        "We try our best to keep the promised schedule. Timings of calls or availability of a mentor may sometimes change, and we will inform students in the WhatsApp group when this happens.",
      ],
    },
    {
      heading: "11. Changes to these Terms",
      paragraphs: [
        'We may update these Terms from time to time. The latest version will always be available on our website, with the "last updated" date at the top.',
      ],
    },
    {
      heading: "12. Contact",
      paragraphs: ["For any question about these Terms, write to us at team.axiomprep8118@gmail.com."],
    },
  ],
};

export const REFUND_POLICY: PolicyDoc = {
  id: "refund",
  title: "Refund Policy",
  href: "/refund",
  intro: "We want every student to join with confidence. This policy explains when a refund is available.",
  sections: [
    {
      heading: "1. When you can get a refund",
      paragraphs: [
        "If you want a refund, you must send us an email within 24 hours after you have joined the mentor group. If we receive your request within this time, we will refund your payment.",
      ],
    },
    {
      heading: "2. How to request a refund",
      paragraphs: [
        "Email team.axiomprep8118@gmail.com within the 24-hour window and include:",
      ],
      bullets: [
        "Your full name",
        "Your WhatsApp number",
        "The plan you bought (for example NEET Gold or JEE Diamond)",
        "Your payment proof (screenshot or transaction ID)",
      ],
    },
    {
      heading: "3. How long a refund takes",
      paragraphs: ["Approved refunds are paid within 7 working days."],
    },
    {
      heading: "4. When a refund is not available",
      bullets: [
        "If the request is sent after 24 hours of joining the mentor group, no refund will be given.",
        "If a student is removed from the group for breaking the group rules in our Terms and Conditions, no refund will be given.",
      ],
    },
    {
      heading: "5. Plan upgrades",
      paragraphs: [
        "If you wish to move to a higher plan instead, you can upgrade by paying only the difference between the two plans' prices. No extra charge is taken.",
      ],
    },
    {
      heading: "6. Contact",
      paragraphs: ["For any question about refunds, write to us at team.axiomprep8118@gmail.com."],
    },
  ],
};

export const PRIVACY_POLICY: PolicyDoc = {
  id: "privacy",
  title: "Privacy Policy",
  href: "/privacy",
  intro:
    "Axiom Prep respects the privacy of its students. This policy explains what information we collect, why we collect it, and how we protect it. Our students may be below or above 18 years of age, and we collect only the minimum details needed to run our programs.",
  sections: [
    {
      heading: "1. Information we collect",
      paragraphs: [
        "We collect:",
        "We do not ask for any other personal information for enrollment.",
      ],
      bullets: [
        "Name",
        "Email address",
        "WhatsApp number, which we need because the mentor group is created on WhatsApp",
        "Payment confirmation details (such as a screenshot or transaction ID) that you share with us so we can verify your payment",
      ],
    },
    {
      heading: "2. Why we collect it",
      bullets: [
        "To verify your payment and confirm your enrollment",
        "To add you to the WhatsApp group with your mentors",
        "To send you updates, call links and program information",
        "To answer your doubts and help you with support or refund requests",
      ],
    },
    {
      heading: "3. We do not share or leak your data",
      paragraphs: [
        "We will not leak your data. We do not sell your data, and we do not share it with any third-party company. Your details are seen only by the Axiom Prep team and the mentors and educators who run your program.",
      ],
    },
    {
      heading: "4. What other group members can see",
      paragraphs: [
        "Because mentor groups run on WhatsApp, the name and WhatsApp number you use in the group can be seen by the other members of that group, including mentors and other students. This is how WhatsApp groups work. Please keep this in mind when you join.",
      ],
    },
    {
      heading: "5. Platforms we use",
      paragraphs: [
        "We use services such as WhatsApp (mentor groups), YouTube (lectures), email, and our website hosting. These platforms handle data under their own privacy policies. We do not give them any extra information about you beyond what is needed to use the service.",
      ],
    },
    {
      heading: "6. How we protect your data",
      paragraphs: [
        "We keep student details with the Axiom Prep team only and take reasonable care to keep them safe. We do not use student details for advertising.",
      ],
    },
    {
      heading: "7. How long we keep your data",
      paragraphs: [
        "We keep your details while you are enrolled and for a reasonable time afterwards for support and records. You may ask us to delete them at any time.",
      ],
    },
    {
      heading: "8. Your rights",
      paragraphs: [
        "You can email us at any time to see the details we hold about you, correct them, or ask us to delete them. We will respond as soon as we reasonably can.",
      ],
    },
    {
      heading: "9. Students below 18",
      paragraphs: [
        "Axiom Prep is open to students below and above 18 years of age. We collect the same limited details from every student, and we apply the same promise to all of them: no leaking and no sharing with third-party companies.",
      ],
    },
    {
      heading: "10. Changes to this policy",
      paragraphs: [
        'We may update this policy from time to time. The latest version will always be on our website, with the "last updated" date at the top.',
      ],
    },
    {
      heading: "11. Contact",
      paragraphs: ["For any privacy question or request, write to us at team.axiomprep8118@gmail.com."],
    },
  ],
};

export const ALL_POLICIES = [TERMS_POLICY, REFUND_POLICY, PRIVACY_POLICY] as const;
