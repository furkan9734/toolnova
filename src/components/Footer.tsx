import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { POPULAR_TOOLS } from '../data/toolsRegistry';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-3">
            <Link to="/" className="inline-block">
              <Logo />
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
              Every Tool You Need. One Place. Browser-native utilities engineered for speed, clarity, and privacy.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
              Popular Tools
            </h2>
            <ul className="space-y-2 text-sm">
              {POPULAR_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    to={`/tools/${tool.slug}`}
                    className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
              Platform
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/tools"
                  className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                >
                  All Tools
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
              Legal & Privacy
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  className="text-slate-600 dark:text-slate-400 hover:text-[#635BFF] dark:hover:text-[#8B5CF6] transition-colors"
                >
                  Sitemap
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; {currentYear} ToolNova. All rights reserved.</p>
          <p>Client-side processing · No private file uploads</p>
        </div>
      </div>
    </footer>
  );
}
