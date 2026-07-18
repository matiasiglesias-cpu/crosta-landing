export const metadata = {
  title: "Privacy Notice — CROSTA",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-foreground/80">
      <h1 className="font-serif text-3xl font-medium text-foreground">
        Privacy Notice
      </h1>
      <p className="mt-2 text-sm text-foreground/50">
        This notice covers the CROSTA waitlist signup form only.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="font-serif text-lg text-foreground">
            What we collect
          </h2>
          <p className="mt-2">
            When you join the waitlist, we store your email address, name,
            birth year, city, and the coupon code we generate for you.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-foreground">
            Why we collect it
          </h2>
          <p className="mt-2">
            To manage the waitlist, prevent duplicate or fraudulent
            signups, and send you your launch coupon. We do not sell or
            share this information with third parties.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-foreground">
            Where it&apos;s stored
          </h2>
          <p className="mt-2">
            Your data is stored in a Supabase database and is only
            accessible by CROSTA&apos;s own servers — it is never exposed
            directly to visitors of this website.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-foreground">Your rights</h2>
          <p className="mt-2">
            You can request access to, correction of, or deletion of your
            data at any time by emailing{" "}
            <a
              href="mailto:crostachips@gmail.com"
              className="underline decoration-dotted underline-offset-2 hover:text-gold-light"
            >
              crostachips@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
