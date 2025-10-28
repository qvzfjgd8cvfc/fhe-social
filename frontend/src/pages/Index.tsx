import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import DiscussionCard from '@/components/DiscussionCard';
import { Button } from '@/components/ui/button';

const Index = () => {
  // Mock data for discussions
  const discussions = [
    {
      id: '1',
      title: 'Privacy in Web3',
      description: 'Discussing the future of privacy-preserving technologies in blockchain',
      messageCount: 42,
      createdBy: '0x1234...5678',
      encrypted: true,
    },
    {
      id: '2',
      title: 'FHE Use Cases',
      description: 'Share your favorite FHE applications and implementations',
      messageCount: 28,
      createdBy: '0xabcd...efgh',
      encrypted: true,
    },
    {
      id: '3',
      title: 'Decentralized Identity',
      description: 'How can FHE improve identity solutions on-chain?',
      messageCount: 15,
      createdBy: '0x9876...5432',
      encrypted: true,
    },
    {
      id: '4',
      title: 'Smart Contract Privacy',
      description: 'Exploring private computations in smart contracts',
      messageCount: 67,
      createdBy: '0x5555...9999',
      encrypted: true,
    },
    {
      id: '5',
      title: 'ZK vs FHE',
      description: 'Comparing zero-knowledge proofs and homomorphic encryption',
      messageCount: 53,
      createdBy: '0x7777...2222',
      encrypted: true,
    },
    {
      id: '6',
      title: 'Cross-chain Privacy',
      description: 'Maintaining privacy across different blockchain networks',
      messageCount: 34,
      createdBy: '0x3333...8888',
      encrypted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-pixel text-foreground mb-2 leading-relaxed">DISCUSSION BOARDS</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Encrypted conversations powered by FHE technology
            </p>
          </div>
          
          <Button className="font-pixel text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-border pixel-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <Plus className="w-4 h-4 mr-2" />
            New Board
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discussions.map((discussion) => (
            <DiscussionCard key={discussion.id} {...discussion} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
