import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFHESocial, useMessages } from '@/hooks/useFHESocial';
import { toast } from 'sonner';
import { MessageSquare, Send, User } from 'lucide-react';

interface MessageListProps {
  channelId: bigint;
}

export function MessageList({ channelId }: MessageListProps) {
  const { address } = useAccount();
  const { postMessage, isPending, isConfirmed, hash, error: writeError } = useFHESocial();
  const { data: messagesData, refetch: refetchMessages } = useMessages(channelId, 0n, 50n);

  const [messageContent, setMessageContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Refetch messages when transaction confirms
  useEffect(() => {
    if (isConfirmed && hash && isPosting) {
      refetchMessages();
      setIsPosting(false);
      setMessageContent('');
      toast.success('Message posted!', {
        description: (
          <div className="flex flex-col gap-1">
            <span>Your message has been posted on-chain</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-600 underline"
            >
              View transaction →
            </a>
          </div>
        ),
      });
    }
  }, [isConfirmed, hash, isPosting, refetchMessages]);

  // Handle write errors
  useEffect(() => {
    if (writeError && writeError !== lastError && isPosting) {
      setLastError(writeError);
      setIsPosting(false);

      let errorMessage = 'Failed to post message';
      if (writeError.message.includes('user rejected') || writeError.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      }

      toast.error(errorMessage, {
        description: (
          <div className="flex flex-col gap-1">
            <span className="text-xs">{writeError.message.slice(0, 100)}</span>
            {hash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 underline"
              >
                View transaction →
              </a>
            )}
          </div>
        ),
      });
    }
  }, [writeError, lastError, hash, isPosting]);

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
      setIsPosting(true);
      setLastError(null);
      // Post as non-anonymous (false)
      await postMessage(channelId, messageContent, false);
      toast.info('Transaction submitted! Waiting for confirmation...');
    } catch (error: any) {
      console.error('Post message error:', error);
      setIsPosting(false);
      toast.error('Failed to post message', {
        description: error.message.slice(0, 100),
      });
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
          disabled={isPending || isPosting || !messageContent.trim()}
          className="w-full"
        >
          {isPending || isPosting ? (
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
          Messages ({messagesData && messagesData[0] ? (messagesData[0] as `0x${string}`[]).length : 0})
        </h3>

        {!messagesData || !messagesData[0] || (messagesData[0] as `0x${string}`[]).length === 0 ? (
          <Card className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No messages yet. Be the first to start the discussion!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {(messagesData[0] as `0x${string}`[]).map((sender, index) => {
              const content = (messagesData[1] as string[])[index];
              const isAnonymous = (messagesData[2] as boolean[])[index];
              const timestamp = Number((messagesData[3] as bigint[])[index]);

              return (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          {isAnonymous ? 'Anonymous' : `${sender.slice(0, 6)}...${sender.slice(-4)}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(timestamp * 1000).toUTCString()}
                        </span>
                      </div>

                      <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
