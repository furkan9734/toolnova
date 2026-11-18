import React, { useState } from 'react';
import { CheckCircle2, Copy, Send } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function ContactPage() {
  useDocumentMeta(
    'Contact ToolNova – Support & Feedback',
    'Get in touch with ToolNova for feature suggestions, bug reports, or Premium early access inquiries.'
  );

  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Feature Request');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submittedDraft, setSubmittedDraft] = useState<string | null>(null);

  const validate = () => {
    const nextErrors: { name?: string; email?: string; message?: string } = {};
    if (name.trim().length < 2) nextErrors.name = 'Enter your name (at least 2 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (message.trim().length < 10) {
      nextErrors.message = 'Please include at least 10 characters in your message.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formatted = `Topic: ${topic}\nFrom: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`;
    setSubmittedDraft(formatted);
    showToast('Message validated and prepared', 'success');
  };

  const handleCopyMessage = async () => {
    if (!submittedDraft) return;
    const ok = await copyToClipboard(submittedDraft);
    if (ok) showToast('Inquiry text copied to clipboard', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">Contact</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Get in touch
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Have a tool suggestion, bug report, or question about upcoming Premium features? Prepare your message below.
        </p>
      </div>

      {submittedDraft ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
                Inquiry Ready
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Because ToolNova runs as a static privacy-first platform without an external relay server, your formatted message is ready below to copy or open in your email client.
              </p>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {submittedDraft}
          </pre>

          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:support@toolnova.example?subject=${encodeURIComponent(
                `[ToolNova] ${topic}`
              )}&body=${encodeURIComponent(submittedDraft)}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              Open Email Client
            </a>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-[#111827] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copy Message
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedDraft(null);
                setName('');
                setEmail('');
                setMessage('');
                setErrors({});
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white"
            >
              Start Another Message
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Lee"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
              {errors.name && <p className="text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
              {errors.email && <p className="text-xs text-rose-600 dark:text-rose-400">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-topic" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Topic
            </label>
            <select
              id="contact-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              <option value="Feature Request">Feature Request</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Premium Early Access">Premium Early Access</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-message" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe how we can help or which tool you would like to see added..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
            {errors.message && <p className="text-xs text-rose-600 dark:text-rose-400">{errors.message}</p>}
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors"
          >
            Prepare Message
          </button>
        </form>
      )}
    </div>
  );
}
