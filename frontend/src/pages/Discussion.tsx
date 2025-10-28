import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Header from '@/components/Header';
import MessageBubble from '@/components/MessageBubble';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const Discussion = () => {
  const { id } = useParams();
  const [message, setMessage] = useState('');

  // Mock data
  const discussion = {
    title: 'Privacy in Web3',
    description: 'Discussing the future of privacy-preserving technologies',
  };

  const messages = [
    {
      id: '1',
      author: '0x1234...5678',
      content: 'FHE is revolutionary for blockchain privacy!',
      timestamp: '2 hours ago',
      encrypted: true,
    },
    {
      id: '2',
      author: '0xabcd...efgh',
      content: 'How does it compare to zero-knowledge proofs?',
      timestamp: '1 hour ago',
      encrypted: true,
    },
    {
      id: '3',
      author: '0x9876...5432',
      content: 'The computational overhead is worth the privacy gains.',
      timestamp: '30 min ago',
      encrypted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to discussions</span>
        </Link>

        <div className="bg-secondary border-4 border-border pixel-shadow p-6 mb-8">
          <h1 className="text-lg font-pixel text-foreground mb-3 leading-relaxed">{discussion.title}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">{discussion.description}</p>
        </div>

        <div className="mb-8">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} />
          ))}
        </div>

        <div className="bg-card border-4 border-border pixel-shadow p-4">
          <Textarea
            placeholder="Type your encrypted message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mb-4 font-pixel text-xs border-2 border-border resize-none min-h-[100px]"
          />
          <Button className="w-full font-pixel text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-border pixel-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Discussion;
