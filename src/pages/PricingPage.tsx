import { Link } from 'react-router-dom';
import { Check, Lock, ArrowRight } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { TOOLS_REGISTRY } from '../data/toolsRegistry';

export default function PricingPage() {
  useDocumentMeta(
    'Pricing – Free & Premium Plans | ToolNova',
    `Compare ToolNova Free and upcoming Premium plans. All ${TOOLS_REGISTRY.length} core browser utilities are free with no account required.`
  );

  const comparisonRows = [
    {
      feature: `Core Utility Access (All ${TOOLS_REGISTRY.length} Tools)`,
      free: 'Included',
      premium: 'Included',
    },
    {
      feature: 'Processing Architecture',
      free: 'Client-side browser processing',
      premium: 'Client-side + Priority batch queues',
    },
    {
      feature: 'Downloads',
      free: 'Standard single-file downloads',
      premium: 'Batch ZIP & multi-file exports',
    },
    {
      feature: 'Saved Presets (QR styles, resize sizes)',
      free: 'Session only',
      premium: 'Synced custom preset library',
    },
    {
      feature: 'Ad Experience',
      free: 'Standard supported layout',
      premium: '100% ad-free workspace',
    },
    {
      feature: 'Account Requirement',
      free: 'No account needed',
      premium: 'Verified account (coming soon)',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-14">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
          Freemium + Pro Workspace
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111827] dark:text-white">
          Simple, transparent pricing
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Start using every utility immediately at zero cost. ToolNova Premium is in preparation with secure server-side billing—no fake checkout or client-side paywall bypasses.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Tier */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111827] dark:text-white">
                  Free
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  For individuals & everyday tasks
                </p>
              </div>
              <p className="font-mono text-3xl font-bold text-[#111827] dark:text-white">
                $0
              </p>
            </div>

            <ul className="space-y-3 pt-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Full access to all {TOOLS_REGISTRY.length} browser utilities</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Standard single-file processing and downloads</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Local favorites & recently used history</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Dark and light themes included</span>
              </li>
            </ul>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors"
          >
            Start Using Free Tools
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Premium Tier */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171B26] border border-[#635BFF]/40 dark:border-[#8B5CF6]/40 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111827] dark:text-white">
                  Premium
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  For heavy workflows & teams · Launching soon
                </p>
              </div>
              <p className="font-mono text-3xl font-bold text-[#635BFF] dark:text-[#8B5CF6]">
                TBA
              </p>
            </div>

            <ul className="space-y-3 pt-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Batch image compression, resizing & conversion</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Saved QR brand color palettes & export dimension presets</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Completely ad-free interface</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Verified server-side billing integration pending release</span>
              </li>
            </ul>
          </div>

          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10131C] text-[#111827] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Request Early Access Info
          </Link>
        </div>
      </div>

      {/* Comparison Matrix */}
      <section aria-labelledby="matrix-heading" className="space-y-4">
        <h2
          id="matrix-heading"
          className="font-display text-xl font-bold text-[#111827] dark:text-white"
        >
          Plan Comparison
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171B26]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C]">
                <th className="py-3.5 px-5 font-display font-semibold text-[#111827] dark:text-white">
                  Capability
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-[#111827] dark:text-white">
                  Free
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
                  Premium (Upcoming)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-5 font-medium text-[#111827] dark:text-slate-200">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">{row.free}</td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
