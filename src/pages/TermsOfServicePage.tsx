import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function TermsOfServicePage() {
  useDocumentMeta(
    'Terms of Service | ToolNova',
    'Review the Terms of Service governing access to ToolNova online browser utilities.'
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">Legal</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Last updated: November 2026
        </p>
      </div>

      <div className="space-y-6 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using ToolNova (&ldquo;the Service&rdquo;), you agree to use the provided browser utilities responsibly and in compliance with applicable laws in your jurisdiction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            2. User Content & Responsibility
          </h2>
          <p>
            Because processing occurs locally in your browser, you retain full ownership and responsibility for all images, PDF documents, QR payloads, and text you process using ToolNova. Always keep backups of critical original files before modifying or compressing them.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            3. Service Availability & Warranty Disclaimer
          </h2>
          <p>
            ToolNova utilities are provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis. While we test our tools carefully across modern desktop and mobile browsers, output accuracy and browser memory limits may vary by device and file complexity.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            4. Changes to Service
          </h2>
          <p>
            We may add new utilities, update existing browser processing engines, or introduce optional Premium tiers over time. Material updates to these terms will be reflected on this page.
          </p>
        </section>
      </div>
    </div>
  );
}
