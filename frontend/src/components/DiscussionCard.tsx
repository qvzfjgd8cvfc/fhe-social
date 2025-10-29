import { MessageSquare, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChannel } from '@/hooks/useFHESocial';

interface DiscussionCardProps {
  id: string;
  title?: string;
  description?: string;
  messageCount?: number;
  createdBy?: string;
  encrypted?: boolean;
}

const DiscussionCard = ({ id }: DiscussionCardProps) => {
  // Fetch channel data from contract
  const { data: channelData } = useChannel(BigInt(id));

  if (!channelData) {
    return (
      <div className="bg-card border-4 border-border pixel-shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const name = channelData[0] as string;
  const description = channelData[1] as string;
  const creator = channelData[2] as string;
  const messageCount = Number(channelData[4]);

  return (
    <Link to={`/channel/${id}`}>
      <div className="bg-card border-4 border-border pixel-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-pixel text-foreground leading-relaxed">{name}</h3>
          <Lock className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" title="FHE Encrypted Voting" />
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {description || 'No description'}
        </p>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>{messageCount} messages</span>
          </div>
          <span className="text-xs text-green-600 font-medium">🗳️ FHE Voting</span>
        </div>
      </div>
    </Link>
  );
};

export default DiscussionCard;
