import { ConnectButton } from '@rainbow-me/rainbowkit';
// brand logo uses public/favicon.svg (pixel chat bubble)
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="border-b-4 border-border bg-card pixel-shadow">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/favicon.svg" alt="VoxCircle" className="w-8 h-8" />
            <h1 className="text-xl text-foreground">VoxCircle</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
