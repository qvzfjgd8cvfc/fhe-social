import { Shield } from 'lucide-react';

interface MessageBubbleProps {
  author: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
}

const MessageBubble = ({ author, content, timestamp, encrypted }: MessageBubbleProps) => {
  return (
    <div className="bg-card border-4 border-border pixel-shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary border-2 border-border" />
          <span className="text-xs font-pixel text-foreground">{author}</span>
          {encrypted && <Shield className="w-4 h-4 text-accent" />}
        </div>
        <span className="text-xs text-muted-foreground">{timestamp}</span>
      </div>
      
      <p className="text-xs text-foreground leading-relaxed">{content}</p>
    </div>
  );
};

export default MessageBubble;
