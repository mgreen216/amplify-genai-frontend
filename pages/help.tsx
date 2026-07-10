/**
 * /help — AI Literacy guide for HFU Amplify users.
 *
 * Public-readable (no auth gate). Deep-linkable section anchors. Static
 * content only — no data fetching, no providers, no client-side
 * interactivity. Renders fast and is safe to surface in help-desk replies,
 * 404 pages, error toasts, etc.
 *
 * Sections marked "EDIT ME" contain wording the HFU team should review/own
 * before broader launch — they're either voice-sensitive (sample prompts)
 * or policy-sensitive (privacy / FERPA).
 */
import Head from 'next/head';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconBook2,
  IconBulb,
  IconLock,
  IconCpu,
  IconSchool,
  IconMail,
  IconAlertTriangle,
} from '@tabler/icons-react';

const SUPPORT_EMAIL = 'helpdesk@holyfamily.edu';

// Hoisted outside the component (rendering-hoist-jsx) — these never change
// between renders, so there's no reason to re-allocate the array.
const TOC = [
  { anchor: 'what',     label: 'What is Amplify?' },
  { anchor: 'capable',  label: 'What can it do?' },
  { anchor: 'prompts',  label: 'Writing good prompts' },
  { anchor: 'privacy',  label: 'What NOT to share' },
  { anchor: 'models',   label: 'Choosing a model' },
  { anchor: 'canvas',   label: 'Connecting Canvas' },
  { anchor: 'limits',   label: 'Where it can be wrong' },
  { anchor: 'help',     label: 'Getting help' },
];

// Reusable section heading — kept as a module-level component
// (rerender-no-inline-components: never define components inside components).
function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 mb-12">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
        <span className="text-blue-600 dark:text-blue-400">{icon}</span>
        {title}
      </h2>
      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <>
      <Head>
        <title>Help & Guide — Amplify</title>
        <meta
          name="description"
          content="How to use Amplify, Holy Family University's campus AI assistant."
        />
      </Head>

      <main className="min-h-screen bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Back link — works whether user came from /home or landed here cold */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6"
          >
            <IconArrowLeft size={16} /> Back to Amplify
          </Link>

          <h1 className="text-3xl font-bold mb-2">Amplify — Help & Guide</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-10">
            Your campus AI assistant. This page walks through what Amplify can
            do, how to ask good questions, what to keep private, and where to
            get help.
          </p>

          {/* Table of contents — anchor links, no JS needed */}
          <nav aria-label="On this page" className="mb-10 p-4 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2">
              On this page
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {TOC.map((t) => (
                <li key={t.anchor}>
                  <a
                    href={`#${t.anchor}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ─── What is Amplify? ─────────────────────────────────────────── */}
          <Section id="what" icon={<IconBook2 size={22} />} title="What is Amplify?">
            <p>
              Amplify is Holy Family University&apos;s own AI assistant. You
              can use it to brainstorm, summarize, draft, explain, compare,
              translate, or analyze — much like ChatGPT or Claude, but
              configured for HFU work and connected to your Canvas courses.
            </p>
            <p>
              Your conversations stay inside HFU&apos;s AWS environment.
              Amplify uses Anthropic Claude and OpenAI GPT models under the
              hood, accessed through HFU&apos;s account — your prompts are not
              used to train those vendors&apos; models.
            </p>
          </Section>

          {/* ─── What can it do? ──────────────────────────────────────────── */}
          <Section id="capable" icon={<IconBulb size={22} />} title="What can it do?">
            <p className="mb-2"><strong>For faculty:</strong></p>
            <ul>
              <li>Draft rubrics, syllabi, or assignment descriptions</li>
              <li>Generate discussion questions from a reading</li>
              <li>Suggest feedback on a student draft (you keep the final say)</li>
              <li>Rewrite material for a different reading level</li>
            </ul>
            <p className="mt-4 mb-2"><strong>For staff:</strong></p>
            <ul>
              <li>Summarize long meeting transcripts into action items</li>
              <li>Draft warm-but-firm replies to student or parent emails</li>
              <li>Compare two policy drafts and flag what changed</li>
              <li>Format messy data into a clean table or list</li>
            </ul>
            <p className="mt-4 mb-2"><strong>For students:</strong></p>
            <ul>
              <li>Turn lecture notes or readings into flashcards</li>
              <li>Plan a study schedule or break a big assignment into steps</li>
              <li>Explain a chapter or concept at your level</li>
              <li>Help you outline an essay (then write it yourself)</li>
            </ul>
          </Section>

          {/* ─── Writing good prompts ─────────────────────────────────────── */}
          <Section id="prompts" icon={<IconBulb size={22} />} title="Writing good prompts">
            <p>You&apos;ll get better results if you:</p>
            <ul>
              <li>
                <strong>Set context first.</strong> &quot;I&apos;m a
                first-year writing instructor at HFU…&quot; gives the model
                tone and audience.
              </li>
              <li>
                <strong>Be specific about format.</strong> &quot;Reply in 3
                short paragraphs&quot; or &quot;Give me a bulleted
                list&quot; works better than &quot;respond&quot;.
              </li>
              <li>
                <strong>Show, don&apos;t just tell.</strong> Paste an example
                of the style you want, or a sample of the data.
              </li>
              <li>
                <strong>Iterate.</strong> If the first answer isn&apos;t right,
                say what to change (&quot;more formal&quot;, &quot;shorter&quot;,
                &quot;include a counter-argument&quot;) instead of starting over.
              </li>
              <li>
                <strong>Ask it to think out loud</strong> for harder tasks —
                &quot;walk me through your reasoning&quot; or &quot;list your
                assumptions first&quot; usually improves accuracy.
              </li>
            </ul>
          </Section>

          {/* ─── Privacy / FERPA ──────────────────────────────────────────── */}
          {/*
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            EDIT ME — FERPA policy wording.
            These bullets are placeholders. Holy Family's General Counsel /
            IT Security should sign off on the final phrasing before this
            page is publicly linked from production. The wording below is a
            reasonable starting draft that aligns with FERPA's "directory
            information" carve-out and common-sense protections, but it is
            NOT a legal review.
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          */}
          <Section id="privacy" icon={<IconLock size={22} />} title="What NOT to share">
            <div className="not-prose mb-4 p-3 rounded border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm">
              <strong>Quick rule of thumb:</strong> if it identifies a specific
              student and a non-public detail about them (grade, accommodation,
              disciplinary action, health info), don&apos;t paste it into
              Amplify with the student&apos;s name attached.
            </div>
            <p><strong>Don&apos;t paste:</strong></p>
            <ul>
              <li>A student&apos;s full name <em>together with</em> their grades, GPA, accommodations, financial-aid status, or disciplinary record</li>
              <li>Social Security numbers, banking info, or government IDs (yours or anyone&apos;s)</li>
              <li>Login credentials, API keys, or passwords</li>
              <li>Health information about a specific identifiable person</li>
              <li>Private contents of someone else&apos;s email or message without their knowledge</li>
            </ul>
            <p className="mt-4"><strong>It&apos;s fine to paste:</strong></p>
            <ul>
              <li>Anonymized or paraphrased examples (&quot;a student wrote about how their family business…&quot;)</li>
              <li>Your own course materials, syllabi, lecture notes</li>
              <li>Public university policies, public webpages, published readings</li>
              <li>Aggregate data with no individual identifiers (&quot;the class average was 78%…&quot;)</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              When in doubt, anonymize. &quot;A student emailed asking
              for…&quot; is almost always enough context for Amplify to help
              draft a reply.
            </p>
          </Section>

          {/* ─── Choosing a model ─────────────────────────────────────────── */}
          <Section id="models" icon={<IconCpu size={22} />} title="Choosing a model">
            <p>The model picker (top of the chat) gives you several options. Rough guide:</p>
            <ul>
              <li><strong>Claude 3.5 Sonnet (cheapest)</strong> — fast, low-cost, great for most chat, drafting, summarization.</li>
              <li><strong>Claude 3.7 Sonnet (default)</strong> — better reasoning. Use for analysis, hard writing, code, multi-step tasks.</li>
              <li><strong>Claude 3.5 Sonnet v1</strong> — older fallback if either of the above is having a bad day.</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              You can switch mid-conversation. Starting a new chat with a
              different model doesn&apos;t cost anything extra — pick what
              fits the task.
            </p>
          </Section>

          {/* ─── Connecting Canvas ────────────────────────────────────────── */}
          <Section id="canvas" icon={<IconSchool size={22} />} title="Connecting Canvas">
            <p>
              You can link your Canvas account to Amplify once (Settings →
              Canvas LMS → Connect Canvas). The connection uses Canvas OAuth —
              Amplify never sees your Canvas password.
            </p>
            {/* Honest-capability note: chat answers grounded in Canvas data
                (what's due, announcements, syllabus) are NOT yet wired into
                the chat pipeline as of July 2026 — the OAuth link works, the
                data flow doesn't. Update this paragraph when that ships. */}
            <p>
              Chat answers based on your Canvas data — &quot;what&apos;s due
              this week?&quot;, recent announcements — are still in
              development and will roll out during the pilot. For now,
              connecting your account simply gets you ready for that release.
            </p>
            <p>
              You can disconnect any time from the same screen. To fully
              revoke Amplify&apos;s authorization on the Canvas side as well,
              remove it under Canvas → Account → Settings → Approved
              Integrations.
            </p>
          </Section>

          {/* ─── Limits / hallucination ───────────────────────────────────── */}
          <Section id="limits" icon={<IconAlertTriangle size={22} />} title="Where it can be wrong">
            <p>
              Amplify is a language model, not a search engine and not a
              colleague. It can:
            </p>
            <ul>
              <li>Invent citations or quotes that sound real. <strong>Always verify sources.</strong></li>
              <li>Be confidently wrong about specific names, dates, or numbers.</li>
              <li>Miss context that you assumed it had — re-read its answer before sending it on.</li>
              <li>Reflect biases present in its training data.</li>
            </ul>
            <p>
              Treat its output like a sharp first draft from a smart intern:
              useful, often great, but yours to verify before it goes out
              under your name.
            </p>
          </Section>

          {/* ─── Help ─────────────────────────────────────────────────────── */}
          <Section id="help" icon={<IconMail size={22} />} title="Getting help">
            <p>
              Hit a bug, see something weird, or have a feature request? Email
              the help desk:
            </p>
            <p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Include a screenshot if you can, and roughly when it happened —
              that helps us find the right logs.
            </p>
          </Section>

          <hr className="my-10 border-gray-200 dark:border-neutral-700" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Amplify is operated by Holy Family University on the open-source
            <a href="https://github.com/gaiin-platform" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
              Amplify GenAI Platform
            </a>
            , originally developed by Vanderbilt University.
          </p>
        </div>
      </main>
    </>
  );
}
