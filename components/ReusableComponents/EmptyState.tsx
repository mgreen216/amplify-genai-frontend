import React, { useState } from 'react';
import { IconMessage, IconRocket, IconSparkles } from '@tabler/icons-react';

/**
 * Audience-tagged sample prompt.
 * The `audience` field renders as a small chip above each suggestion so
 * users can quickly recognize "the staff one" or "the student one" without
 * reading all nine.
 */
type Audience = 'Faculty' | 'Staff' | 'Student';
interface AudiencePrompt {
  audience: Audience;
  text: string;
}

/**
 * ──────────────────────────────────────────────────────────────────────────
 * EDIT ME — these prompts are the first thing every HFU user sees on a fresh
 * chat. Rewrite to match the voice / vocabulary you'd hear in a Holy Family
 * hallway. Keep ~3 per audience for grid balance; trim or grow the array
 * freely. Hoisted outside the component so React doesn't re-allocate it on
 * every render (rendering-hoist-jsx rule).
 *
 * Tips when editing:
 *  - One clear verb per prompt ("Draft", "Summarize", "Compare")
 *  - Ground in something concrete a person at HFU actually does
 *  - Avoid prompts that require a file unless you also wire an upload hint
 * ──────────────────────────────────────────────────────────────────────────
 */
const PROMPT_POOL: AudiencePrompt[] = [
  // Faculty — teaching, course design, feedback
  { audience: 'Faculty', text: 'Draft a rubric for a 5-page response paper on a topic of my choosing' },
  { audience: 'Faculty', text: 'Suggest three discussion questions for tomorrow’s class on this reading' },
  { audience: 'Faculty', text: 'Rewrite this assignment description so it’s clearer for first-year students' },

  // Staff — communication, process, summarization
  { audience: 'Staff', text: 'Draft a reply to this student email — keep it warm but firm' },
  { audience: 'Staff', text: 'Summarize this meeting transcript into action items with owners' },
  { audience: 'Staff', text: 'Compare these two policy drafts and flag what changed' },

  // Student — studying, planning, writing.
  // NOTE: do NOT add Canvas-data prompts ("what's due this week?") until the
  // chat pipeline is actually wired to Canvas — as of July 2026 the OAuth
  // connection works but chat cannot read Canvas data, and a prompt that
  // promises it invites hallucinated course info on a user's first click.
  { audience: 'Student', text: 'Make flashcards from this lecture handout' },
  { audience: 'Student', text: 'Help me plan a study schedule for finals week' },
  { audience: 'Student', text: 'Explain this chapter like I’m studying for the first time' },
];

/**
 * Maps an audience to a Tailwind class pair (badge bg + text).
 * Hoisted as a plain lookup object — cheaper than a switch inside render
 * and easier to extend if a fourth audience is added later.
 */
const AUDIENCE_STYLES: Record<Audience, string> = {
  Faculty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Staff:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const DEFAULT_ICON = <IconMessage size={64} />;

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Optional override. If callers pass a `string[]`, we render plain text
   * cards (no audience chips). If omitted, we render the full audience-
   * tagged PROMPT_POOL. Backward-compatible with existing call sites.
   */
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Welcome to Amplify',
  description = "I'm your campus AI assistant. I can help with research, Canvas courses, drafting, and analysis. Try a suggestion below or type your own question.",
  icon = DEFAULT_ICON,
  action,
  suggestions,
  onSuggestionClick,
}) => {
  // Lazy state init (rerender-lazy-state-init rule): compute the displayed
  // prompts ONCE on mount instead of on every render. If callers pass a
  // suggestions[] override we use that; otherwise we show the full pool.
  const [displayPrompts] = useState<AudiencePrompt[] | string[]>(() =>
    suggestions && suggestions.length > 0 ? suggestions : PROMPT_POOL
  );

  // Detect which mode we’re in once, not per-item, so the map() below stays tight.
  const isAudienceMode = typeof displayPrompts[0] !== 'string';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 animate-fade-in">
      <div className="text-gray-300 dark:text-gray-600 mb-6">
        {icon}
      </div>

      <h3 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        {description}
      </p>

      {displayPrompts.length > 0 && (
        <div className="w-full max-w-3xl mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center flex items-center justify-center gap-2">
            <IconSparkles size={16} />
            Try one of these — or type your own question
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayPrompts.map((item, index) => {
              const text = isAudienceMode ? (item as AudiencePrompt).text : (item as string);
              const audience = isAudienceMode ? (item as AudiencePrompt).audience : null;
              return (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(text)}
                  className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700
                           hover:border-blue-400 dark:hover:border-blue-600 hover:bg-gray-50
                           dark:hover:bg-gray-800 transition-all duration-200 group flex flex-col gap-2"
                >
                  {audience && (
                    <span className={`self-start text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded ${AUDIENCE_STYLES[audience]}`}>
                      {audience}
                    </span>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600
                              dark:group-hover:text-blue-400 transition-colors">
                    {text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                   hover:bg-blue-700 transition-colors duration-200"
        >
          <IconRocket size={20} />
          {action.label}
        </button>
      )}
    </div>
  );
};
