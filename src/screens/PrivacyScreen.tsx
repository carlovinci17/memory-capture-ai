import { isDemoMode } from '../lib/demo/demoMode';

function Section({
  eyebrow,
  title,
  children,
  delay = '0s',
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <div className="panel rise" style={{ animationDelay: delay }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        {eyebrow}
      </div>
      <h2 className="display" style={{ fontSize: 22, marginBottom: 18 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function PrivacyScreen() {
  const demo = isDemoMode();

  return (
    <div className="page">
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Transparency
        </div>
        <h1 className="display" style={{ fontSize: 34, marginBottom: 10 }}>
          How this app works
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', maxWidth: 560, lineHeight: 1.6, margin: 0 }}>
          Plain language about data storage, AI, and security — so you can use this
          app with confidence.
        </p>
        {demo && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 14,
              padding: '4px 12px',
              borderRadius: 99,
              background: 'color-mix(in oklab, var(--bloom-a) 22%, var(--surface-3))',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
            }}
          >
            Currently in Demo mode
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1 — Data storage */}
        <Section eyebrow="Data storage" title="Your stories stay with you" delay="0s">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--r-lg)',
                border: `2px solid ${demo ? 'var(--accent)' : 'var(--line)'}`,
                background: demo
                  ? 'color-mix(in oklab, var(--accent-wash) 30%, var(--surface))'
                  : 'var(--surface-2)',
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-ink)',
                  marginBottom: 8,
                }}
              >
                Demo mode {demo && '· active'}
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                Everything stays on <strong>this device only</strong> — stored in your
                browser's localStorage. Nothing is sent to any server. Clearing your
                browser data removes all stories permanently.
              </p>
            </div>
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--r-lg)',
                border: `2px solid ${!demo ? 'var(--accent)' : 'var(--line)'}`,
                background: !demo
                  ? 'color-mix(in oklab, var(--accent-wash) 30%, var(--surface))'
                  : 'var(--surface-2)',
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-ink)',
                  marginBottom: 8,
                }}
              >
                Production mode {!demo && '· active'}
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                Stories and photos are stored in <strong>Azure Cosmos DB and Blob
                Storage</strong> (Microsoft cloud). Getting here requires signing in
                with Google and admin approval — it isn't open sign-up.
              </p>
            </div>
          </div>
        </Section>

        {/* Section 2 — Responsible AI */}
        <Section eyebrow="Responsible AI" title="How AI helps" delay=".05s">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Fact label="Interview questions">
              Azure OpenAI generates thoughtful questions to guide the conversation.
              Your responses are sent to Microsoft's servers to produce each next
              question, then discarded — they are not stored or used to train any model.
            </Fact>
            <Fact label="Session summaries">
              At the end of each interview, Azure OpenAI summarises what was shared into
              a short reflection. The same transient processing applies — no retention.
            </Fact>
            <Fact label="Voice transcription">
              If you use the microphone, your speech is transcribed by Azure AI Speech.
              Audio is processed in real time and not stored.
            </Fact>
            <Fact label="What AI does not do">
              AI here is a guide, not a judge. It does not evaluate, score, or make
              decisions about you or your stories. Every word captured belongs to you.
            </Fact>
            <p
              style={{
                fontSize: 12,
                color: 'var(--ink-3)',
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              Microsoft's data processing commitments apply to all Azure AI services
              used here. See{' '}
              <a
                href="https://www.microsoft.com/en-us/trust-center/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-ink)' }}
              >
                Microsoft Trust Center
              </a>{' '}
              for details.
            </p>
          </div>
        </Section>

        {/* Section 3 — Security */}
        <Section eyebrow="Security" title="Built with care" delay=".1s">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Fact label="No cookies or ad tracking">
              Full access uses Google sign-in, so your Google email is kept to gate
              approval and let you sign back in — that's the only account data this
              app holds. Beyond that, there are no cookies, analytics scripts, or
              third-party trackers of any kind.
            </Fact>
            <Fact label="Not indexed by search engines">
              This app is blocked from Google, Bing, and all other search engines via
              robots.txt and meta tags. It is shared directly, not discoverable publicly.
            </Fact>
            <Fact label="Full access is invite-only">
              Signing in with Google doesn't grant cloud access by itself — an admin
              must approve the request first. Anyone not yet approved (or not signed
              in) uses demo mode, which needs no account at all.
            </Fact>
            <Fact label="Data in transit and at rest">
              All communication with Azure services uses HTTPS. Data stored in Azure
              Cosmos DB and Blob Storage is encrypted at rest by Microsoft's
              infrastructure.
            </Fact>
          </div>
        </Section>
      </div>
    </div>
  );
}
