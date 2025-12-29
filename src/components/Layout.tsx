import { ReactNode } from 'react';
import CommandSidebar from '@/components/CommandSidebar';
import MobileNavigation from '@/components/MobileNavigation';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Offline/Sync Indicator */}
      <OfflineIndicator />
      
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && <CommandSidebar />}
      
      {/* Main Content Area */}
      <main className={`flex-1 ${!isMobile ? 'ml-16 lg:ml-64' : ''} transition-all duration-300`}>
        <div className="min-h-screen p-4 md:p-6 pb-20 md:pb-6 pt-12">
          {children}
        </div>
        
        {/* Footer - hidden on mobile */}
        {!isMobile && (
          <footer className="border-t border-border py-4 px-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Desenvolvido por:{' '}
                <a
                  href="https://www.linkedin.com/in/cesar-monteiro-030bb3170"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  César Monteiro
                </a>
              </p>
            </div>
          </footer>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default Layout;
