import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function PrivacyPolicyPage() {
  useDocumentMeta(
    'Privacy Policy | ToolNova',
    'Read how ToolNova protects your privacy with client-side browser processing and zero private file uploads.'
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">Legal</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Last updated: November 2026
        </p>
      </div>

      <div className="space-y-6 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            1. Local Browser Processing
          </h2>
          <p>
            ToolNova utilities process your files and text exclusively inside your web browser using client-side APIs (HTML5 Canvas, Web Crypto, and local PDF libraries). We do not upload, inspect, or store your images, PDFs, QR payloads, or text inputs on external servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            2. Generated Passwords
          </h2>
          <p>
            Passwords created in the Password Generator use <code className="font-mono text-xs">window.crypto.getRandomValues</code> in volatile memory only. Generated passwords are never written to LocalStorage, cookies, session logs, or analytics events.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            3. Browser LocalStorage Preferences
          </h2>
          <p>
            ToolNova uses browser LocalStorage strictly to remember your optional preferences: selected color theme (light or dark), favorite tools, and recently visited tool slugs. You can clear these at any time through your browser settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            4. Future Premium Services
          </h2>
          <p>
            If optional paid features are introduced in a future release, this Privacy Policy will be updated beforehand to describe any server-side billing or account data required for those opt-in features.
          </p>
        </section>
      </div>
    </div>
  );
}
