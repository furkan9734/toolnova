import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { ToastProvider } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { useToolHistory } from './hooks/useToolHistory';
import HomePage from './pages/HomePage';
import ToolsPage from './pages/ToolsPage';
import ToolDetailPage from './pages/ToolDetailPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import NotFoundPage from './pages/NotFoundPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { recentSlugs, favoriteSlugs, recordToolVisit, toggleFavorite, isFavorite } =
    useToolHistory();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#111827] dark:bg-[#10131C] dark:text-[#F1F5F9] transition-colors">
      <ScrollToTop />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                recentSlugs={recentSlugs}
                favoriteSlugs={favoriteSlugs}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
            }
          />
          <Route
            path="/tools"
            element={
              <ToolsPage
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                favoriteSlugs={favoriteSlugs}
              />
            }
          />
          <Route
            path="/tools/:slug"
            element={
              <ToolDetailPage
                recordToolVisit={recordToolVisit}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
            }
          />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </BrowserRouter>
  );
}
