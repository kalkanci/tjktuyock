import React from 'react';
import { Trophy, TrendingUp, Calendar, Ticket } from 'lucide-react';
import { Page } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  // Welcome sayfasında layout gösterme
  if (currentPage === 'welcome') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-racing-950 text-gray-100 pb-28 md:pb-0 md:pl-64">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-racing-950/80 border-b border-racing-800 flex items-center justify-center px-4 z-50 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-racing-gold" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-racing-gold to-yellow-600 bg-clip-text text-transparent tracking-wide">
            TJK ANALİZ AI
          </h1>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-racing-900 border-r border-racing-800 flex-col z-50 shadow-2xl">
        <div className="h-20 flex items-center justify-center gap-3 border-b border-racing-800 bg-gradient-to-b from-racing-900 to-racing-950">
          <div className="bg-racing-gold/10 p-2 rounded-lg">
            <Trophy className="w-6 h-6 text-racing-gold" />
          </div>
          <span className="text-lg font-bold tracking-wider text-white">TJK Analiz</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem 
            icon={<TrendingUp />} 
            label="Günlük Bülten" 
            active={currentPage === 'bulletin'} 
            onClick={() => onNavigate('bulletin')}
          />
          <NavItem 
            icon={<Calendar />} 
            label="Geçmiş Sonuçlar" 
            active={currentPage === 'results'} 
            onClick={() => onNavigate('results')}
          />
           <NavItem 
            icon={<Ticket />} 
            label="Kupon Oluşturucu" 
            active={currentPage === 'coupon-creator'} 
            onClick={() => onNavigate('coupon-creator')}
          />
        </nav>

        <div className="p-6 border-t border-racing-800 bg-racing-900/50">
          <div className="bg-racing-800/50 rounded-xl p-4 text-xs text-gray-400 border border-racing-700/50">
            <p>Veriler yapay zeka tarafından internet taraması ile sağlanır. Kesinlik içermez.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-20 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav - Card Style */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-stretch gap-2">
        <MobileNavItem 
          icon={<TrendingUp />} 
          label="Bülten" 
          active={currentPage === 'bulletin'} 
          onClick={() => onNavigate('bulletin')}
        />
        <MobileNavItem 
          icon={<Calendar />} 
          label="Sonuçlar" 
          active={currentPage === 'results'} 
          onClick={() => onNavigate('results')}
        />
        <MobileNavItem 
          icon={<Ticket />} 
          label="Kupon Yap" 
          active={currentPage === 'coupon-creator'} 
          onClick={() => onNavigate('coupon-creator')}
        />
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
      ${active 
        ? 'bg-racing-800 text-blue-400 border border-racing-700 shadow-md' 
        : 'text-gray-400 hover:bg-racing-800/50 hover:text-gray-100'}`}
  >
    <div className={`${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
      {React.cloneElement(icon as React.ReactElement<{ size?: number | string }>, { size: 20 })}
    </div>
    <span className="font-medium tracking-wide">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
  </button>
);

const MobileNavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border backdrop-blur-md shadow-lg
      ${active 
        ? 'bg-racing-800 border-racing-700 text-blue-400 translate-y-[-4px] shadow-blue-900/20' 
        : 'bg-racing-900/90 border-racing-800 text-gray-500 hover:bg-racing-800'}`}
  >
    {React.cloneElement(icon as React.ReactElement<{ size?: number | string }>, { size: 22, strokeWidth: active ? 2.5 : 2 })}
    <span className="text-[10px] mt-1 font-bold tracking-wide">{label}</span>
  </button>
);