import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Globe, ArrowRight } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { TOOLS_REGISTRY } from '../data/toolsRegistry';

export default function AboutPage() {
  useDocumentMeta(
    'About ToolNova – Private Browser-Native Utilities',
    'Learn how ToolNova delivers fast image, PDF, QR code, text, and security tools directly inside your browser without uploading private files.'
  );

  const pillars = [
    {
      icon: <ShieldCheck className="w-5 h-5" aria-hidden="true" />,
      title: '01. Private by Architecture',
      body: 'Image compression, PDF merging, page rendering, QR generation, and password creation execute inside your browser sandbox. Private user files are never transmitted to remote storage.',
    },
    {
      icon: <Cpu className="w-5 h-5" aria-hidden="true" />,
      title: '02. Zero-Bloat Performance',
      body: 'Instead of heavy server queues, ToolNova uses native HTML5 Canvas, Web Crypto APIs, and compact client-side PDF libraries so every action responds immediately.',
    },
    {
      icon: <Globe className="w-5 h-5" aria-hidden="true" />,
      title: '03. Accessible Anywhere',
      body: 'Built mobile-first for worldwide users on desktop and Android or iOS browsers, with full keyboard navigation, readable typography, and light or dark themes.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="space-y-4">
        <p className="text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
          About ToolNova
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111827] dark:text-white">
          Every Tool You Need. One Place.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          ToolNova is an all-in-one online utility platform designed to replace cluttered single-purpose websites with one fast, consistent, privacy-respecting workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="p-6 rounded-2xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="w-10 h-10 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 text-[#635BFF] dark:text-[#8B5CF6] flex items-center justify-center">
              {pillar.icon}
            </div>
            <h2 className="font-display text-base font-semibold text-[#111827] dark:text-white">
              {pillar.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {pillar.body}
            </p>
          </div>
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#111827] dark:text-white">
            Ready to try a tool?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Open any of our {TOOLS_REGISTRY.length} browser utilities with no signup required.
          </p>
        </div>
        <Link
          to="/tools"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors shrink-0"
        >
          Explore Tools
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
