import { MessageSquare, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DiscussionCardProps {
  id: string;
  title: string;
  description: string;
  messageCount: number;
  createdBy: string;
  encrypted: boolean;
}

const DiscussionCard = ({ id, title, description, messageCount, createdBy, encrypted }: DiscussionCardProps) => {
  return (
    <Link to={`/discussion/${id}`}>
      <div className="bg-card border-4 border-border pixel-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-pixel text-foreground leading-relaxed">{title}</h3>
          {encrypted && (
            <Lock className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{description}</p>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>{messageCount} messages</span>
          </div>
          <span className="text-muted-foreground">by {createdBy}</span>
        </div>
      </div>
    </Link>
  );
};

export default DiscussionCard;
