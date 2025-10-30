import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from 'react-router-dom';
import { Github, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="border-b-4 border-border bg-card pixel-shadow">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/favicon.svg" alt="VoxCircle" className="w-8 h-8" />
            <h1 className="text-xl text-foreground">VoxCircle</h1>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-sm"
            >
              <Link to="/how-it-works">
                <HelpCircle className="w-4 h-4 mr-1.5" />
                How It Works
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="p-2"
            >
              <a
                href="https://github.com/qvzfjgd8cvfc/fhe-social"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
            </Button>

            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
