import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { VotingPanel } from '@/components/VotingPanel';
import { MessageList } from '@/components/MessageList';
import { useChannel } from '@/hooks/useFHESocial';

export default function ChannelDetail() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { data: channelData } = useChannel(channelId ? BigInt(channelId) : undefined);

  if (!channelId) {
    return <div>Invalid channel ID</div>;
  }

  // New contract returns: [name, description, creator, createdAt, active]
  const channel = channelData ? {
    name: channelData[0],
    description: channelData[1],
    creator: channelData[2],
    createdAt: Number(channelData[3]),
    active: channelData[4],
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Boards
        </Button>

        {channel ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold mb-2">{channel.name}</h1>
              {channel.description && (
                <p className="text-muted-foreground mb-4">{channel.description}</p>
              )}
              <div className="text-sm text-muted-foreground">
                <p>Created: {new Date(channel.createdAt * 1000).toLocaleDateString()}</p>
                <p>Creator: {channel.creator.slice(0, 6)}...{channel.creator.slice(-4)}</p>
              </div>
            </div>

            <VotingPanel channelId={BigInt(channelId)} />

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">💬 Discussion Board</h2>
              <MessageList channelId={BigInt(channelId)} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p>Loading channel...</p>
          </div>
        )}
      </main>
    </div>
  );
}
