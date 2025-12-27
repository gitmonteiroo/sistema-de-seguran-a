import { ReactNode } from 'react';
import CommandSidebar from '@/components/CommandSidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <CommandSidebar />
      
      {/* Main Content Area - offset for sidebar */}
      <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
        <div className="min-h-screen p-6">
          {children}
        </div>
        
        {/* Footer */}
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
      </main>
    </div>
  );
};

export default Layout;
