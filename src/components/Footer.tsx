import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold tracking-wide text-axiom">AXIOM PREP</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
            One Place For All Your Science Needs. Explore. Question. Understand.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm md:col-span-2 md:grid-cols-3">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Learn</p>
            <div className="space-y-2 text-zinc-400">
              <Link href="/top-teachers" className="block hover:text-ink">
                Top Teachers
              </Link>
              <Link href="/originals" className="block hover:text-ink">
                Originals
              </Link>
              <Link href="/practice" className="block hover:text-ink">
                Practice
              </Link>
              <Link href="/pyq-bank" className="block hover:text-ink">
                PYQs
              </Link>
              <Link href="/leaderboard" className="block hover:text-ink">
                Leaderboard
              </Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tools</p>
            <div className="space-y-2 text-zinc-400">
              <Link href="/originals/quizzes" className="block hover:text-ink">
                Quiz Tests
              </Link>
              <Link href="/originals/top-tests" className="block hover:text-ink">
                Full Syllabus Tests
              </Link>
              <Link href="/study-hub" className="block hover:text-ink">
                Timer & Study Hub
              </Link>
              <Link href="/originals/prep-tracker" className="block hover:text-ink">
                Prep Tracker
              </Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Account</p>
            <div className="space-y-2 text-zinc-400">
              <Link href="/login" className="block hover:text-ink">
                Login
              </Link>
              <Link href="/subscription" className="block hover:text-ink">
                Subscription
              </Link>
              <Link href="/about" className="block hover:text-ink">
                About
              </Link>
              <Link href="/originals/community" className="block hover:text-ink">
                Community
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-line/50">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-zinc-600 sm:px-6">
          © {new Date().getFullYear()} Axiom Prep. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
