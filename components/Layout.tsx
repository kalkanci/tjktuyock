import React from 'react';
import { Trophy, TrendingUp, Calendar, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-racing-900 text-gray-100 pb-20 md:pb-0 md:pl-64">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-racing-800 border-b border-racing-700 flex items-center justify-between px-4 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-racing-gold" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            TJK Analiz
          </h1>
        </div>
        <button className="p-2 text-gray-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-racing-800 border-r border-racing-700 flex-col z-50">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-racing-700">
          <Trophy className="w-8 h-8 text-racing-gold" />
          <span className="text-xl font-bold">TJK Analiz AI</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<TrendingUp />} label="Günlük Bülten" active />
          <NavItem icon={<Calendar />} label="Geçmiş Sonuçlar" />
        </nav>

        <div className="p-4 border-t border-racing-700">
          <div className="bg-racing-900 rounded-lg p-3 text-xs text-gray-400">
            <p>Veriler yapay zeka tarafından internet taraması ile sağlanır.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-20 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-racing-800 border-t border-racing-700 flex items-center justify-around z-50">
        <MobileNavItem icon={<TrendingUp />} label="Bülten" active />
        <MobileNavItem icon={<Calendar />} label="Sonuçlar" />
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-racing-700 text-racing-accent' : 'text-gray-400 hover:bg-racing-700/50 hover:text-gray-200'}`}>
    {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`flex flex-col items-center justify-center w-full h-full ${active ? 'text-racing-accent' : 'text-gray-500'}`}>
    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);