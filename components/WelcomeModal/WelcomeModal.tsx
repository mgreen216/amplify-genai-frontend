/**
 * WelcomeModal — first-run AI literacy primer.
 *
 * Fires ONCE per browser (per user, per device) on the first authenticated
 * load. Gated by a versioned localStorage key — if we materially change the
 * content, bump WELCOME_VERSION and everyone re-sees it.
 *
 * Design notes:
 *  - Three screens, hand-paced. More than three and people skip; fewer and
 *    we waste the only moment they're paying attention.
 *  - Skip is a first-class action (top-right), not buried — power users
 *    shouldn't have to click through to dismiss.
 *  - createPortal to document.body so we render above any z-index regardless
 *    of where in the tree the parent mounts us (matches BatchProcessModal
 *    pattern elsewhere in this codebase).
 *  - No animation library — a simple opacity/translate transition on the
 *    inner card is enough and avoids pulling framer-motion just for this.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  IconSparkles,
  IconBulb,
  IconLock,
  IconArrowRight,
  IconArrowLeft,
  IconX,
  IconCheck,
} from '@tabler/icons-react';

// Bump this when the modal content changes meaningfully and you want all
// existing users to re-see it. Keep the old key alive in code? No — once
// bumped, the old key just becomes orphaned localStorage (cheap, harmless).
// See client-localstorage-schema rule: version + minimize.
const WELCOME_VERSION = 'v1';
const STORAGE_KEY = `amplify_welcome_seen_${WELCOME_VERSION}`;

interface WelcomeModalProps {
  onClose: () => void;
}

// Screen content lives at module scope (rendering-hoist-jsx) — never
// re-allocated per render. Each screen is a function returning JSX so we
// can keep them readable inline while still benefiting from hoisting.
const SCREENS: Array<{
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}> = [
  {
    icon: <IconSparkles size={36} className="text-blue-500" />,
    title: 'Welcome to Amplify',
    body: (
      <>
        <p className="mb-3">
          Amplify is Holy Family University&apos;s own AI assistant. You can
          ask it to draft, summarize, explain, compare, or analyze — much
          like ChatGPT or Claude, but configured for HFU work and connected
          to your Canvas courses.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your conversations stay inside HFU&apos;s AWS environment. The
          model providers don&apos;t use your prompts for training.
        </p>
      </>
    ),
  },
  {
    icon: <IconBulb size={36} className="text-amber-500" />,
    title: 'Tip: be specific',
    body: (
      <>
        <p className="mb-3">
          You&apos;ll get noticeably better answers if you give Amplify
          context up front.
        </p>
        <div className="not-prose bg-gray-50 dark:bg-neutral-800 rounded p-3 text-sm border-l-4 border-blue-400">
          <p className="mb-1">
            <span className="text-red-500 font-semibold">×</span>{' '}
            &quot;Write an email&quot;
          </p>
          <p>
            <span className="text-green-500 font-semibold">✓</span>{' '}
            &quot;Draft a 3-paragraph reply to this student email — warm but
            firm, no apology for our policy.&quot;
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          More tips on the{' '}
          <a href="/help#prompts" className="text-blue-600 dark:text-blue-400 hover:underline">
            Help & Guide
          </a>{' '}
          page.
        </p>
      </>
    ),
  },
  {
    icon: <IconLock size={36} className="text-emerald-500" />,
    title: 'Keep student data private',
    body: (
      <>
        <p className="mb-3">
          One quick rule before you start: don&apos;t paste a student&apos;s
          name together with their grades, accommodations, or other
          non-public records. Anonymize first.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          &quot;A student emailed asking for…&quot; is almost always enough
          context. See the full{' '}
          <a href="/help#privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
            privacy guide
          </a>{' '}
          for what&apos;s OK and what isn&apos;t.
        </p>
      </>
    ),
  },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  // SSR guard — createPortal needs document, which doesn't exist on the
  // server. The mounted flag flips after first client effect runs.
  const [mounted, setMounted] = useState(false);
  const [screenIdx, setScreenIdx] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // markSeenAndClose is stable across re-renders (useCallback) so it can
  // safely be passed to nested buttons without causing re-renders.
  const markSeenAndClose = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // localStorage can throw in private mode / quota-exceeded. We still
      // want to close the modal — losing the "seen" flag just means we'd
      // show the modal again next visit, which is annoying but not broken.
    }
    onClose();
  }, [onClose]);

  // Keyboard: Esc dismisses, ← → navigate between screens.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') markSeenAndClose();
      else if (e.key === 'ArrowRight' && screenIdx < SCREENS.length - 1) {
        setScreenIdx((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && screenIdx > 0) {
        setScreenIdx((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screenIdx, markSeenAndClose]);

  if (!mounted) return null;

  const screen = SCREENS[screenIdx];
  const isLast = screenIdx === SCREENS.length - 1;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      onClick={(e) => {
        // Backdrop click dismisses. Inner card stops propagation below.
        if (e.target === e.currentTarget) markSeenAndClose();
      }}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl bg-white dark:bg-neutral-900 shadow-2xl border border-gray-200 dark:border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Skip / close — top right, always reachable */}
        <button
          onClick={markSeenAndClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Skip welcome guide"
        >
          <IconX size={20} />
        </button>

        <div className="p-8">
          <div className="mb-4">{screen.icon}</div>
          <h2
            id="welcome-modal-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3"
          >
            {screen.title}
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            {screen.body}
          </div>
        </div>

        {/* Footer: progress dots + nav buttons */}
        <div className="flex items-center justify-between px-8 pb-6">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {SCREENS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === screenIdx
                    ? 'w-6 bg-blue-500'
                    : 'w-1.5 bg-gray-300 dark:bg-neutral-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {screenIdx > 0 && (
              <button
                onClick={() => setScreenIdx((i) => i - 1)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
              >
                <IconArrowLeft size={16} /> Back
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setScreenIdx((i) => i + 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Next <IconArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={markSeenAndClose}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <IconCheck size={16} /> Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

/**
 * Read-only helper for callers — true if the user has already dismissed
 * the modal at the current WELCOME_VERSION. Safe to call on the server
 * (returns false). Use to decide whether to render the modal at all.
 */
export function hasSeenWelcome(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
