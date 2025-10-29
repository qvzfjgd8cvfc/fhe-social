import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFHESocial } from '@/hooks/useFHESocial';
import { CONTRACTS, ABIS } from '@/contracts/constants';
import { toast } from 'sonner';
import { MessageSquare, Send, User } from 'lucide-react';

interface Message {
  id: bigint;
  content: string;
  author: string;
  timestamp: number;
}

interface MessageListProps {
  channelId: bigint;
}

export function MessageList({ channelId }: MessageListProps) {
  const { address } = useAccount();
  const { postMessage, isPending, isConfirmed } = useFHESocial();

  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Get message IDs for this channel
  const { data: messageIds, refetch: refetchMessageIds } = useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getChannelMessages',
    args: [channelId],
    query: {
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  });

  // Fetch all messages when message IDs change
  useEffect(() => {
    const fetchMessages = async () => {
      if (!messageIds || messageIds.length === 0) {
        setMessages([]);
        return;
      }

      const fetchedMessages: Message[] = [];

      for (const msgId of messageIds as bigint[]) {
        try {
          // Get message details
          const msgData = await fetch(`http://localhost:8081/api/message/${msgId}`).catch(() => null);

          // Fallback to direct contract call
          const response = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{
              to: CONTRACTS.FHESocialVoting,
              data: '0x...' // getMessage(msgId)
            }, 'latest']
          }).catch(() => null);

          // For now, we'll use a simpler approach with useReadContract
          fetchedMessages.push({
            id: msgId,
            content: `Message ${msgId}`,
            author: '0x...',
            timestamp: Date.now() / 1000,
          });
        } catch (error) {
          console.error('Failed to fetch message:', error);
        }
      }

      setMessages(fetchedMessages);
    };

    fetchMessages();
  }, [messageIds]);

  // Refetch messages when transaction confirms
  useEffect(() => {
    if (isConfirmed) {
      refetchMessageIds();
      toast.success('Message posted successfully!');
      setMessageContent('');
    }
  }, [isConfirmed, refetchMessageIds]);

  const handlePostMessage = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await postMessage(channelId, messageContent);
      toast.info('Transaction submitted! Waiting for confirmation...');
    } catch (error: any) {
      console.error('Post message error:', error);
      toast.error(`Failed to post message: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Post new message */}
      <Card className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <MessageSquare className="w-5 h-5 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Post a Message</h3>
            <p className="text-xs text-muted-foreground">
              Share your thoughts openly. Messages are stored as plaintext on-chain.
            </p>
          </div>
        </div>

        <Textarea
          placeholder="Write your message here..."
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          className="mb-3 min-h-[100px]"
          disabled={isPending}
        />

        <Button
          onClick={handlePostMessage}
          disabled={isPending || !messageContent.trim()}
          className="w-full"
        >
          {isPending ? (
            <>⏳ Posting...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post Message
            </>
          )}
        </Button>
      </Card>

      {/* Messages list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">
          Messages ({messageIds ? (messageIds as bigint[]).length : 0})
        </h3>

        {!messageIds || (messageIds as bigint[]).length === 0 ? (
          <Card className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No messages yet. Be the first to start the discussion!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {(messageIds as bigint[]).map((msgId) => (
              <MessageCard key={msgId.toString()} messageId={msgId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual message card component
function MessageCard({ messageId }: { messageId: bigint }) {
  const { data: messageData } = useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getMessage',
    args: [messageId],
  });

  if (!messageData) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </Card>
    );
  }

  const content = messageData[0] as string;
  const timestamp = Number(messageData[1]);
  const channelId = messageData[2];
  const replyCount = Number(messageData[3]);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Anonymous User</span>
            <span className="text-xs text-muted-foreground">
              {new Date(timestamp * 1000).toLocaleString()}
            </span>
          </div>

          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>

          {replyCount > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              💬 {replyCount} replies
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
