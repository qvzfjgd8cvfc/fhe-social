import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import Header from '@/components/Header';
import DiscussionCard from '@/components/DiscussionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFHESocial, useStats, useUserProfile } from '@/hooks/useFHESocial';
import { CONTRACTS, ABIS } from '@/contracts/constants';
import { toast } from 'sonner';

const Index = () => {
  const { address, isConnected } = useAccount();
  const { registerUser, createChannelWithVote, isPending, isConfirmed } = useFHESocial();
  const { data: stats, refetch: refetchStats } = useStats();
  const { data: userProfile, refetch: refetchUserProfile } = useUserProfile(address);

  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [channels, setChannels] = useState<any[]>([]);

  // Check if user is registered
  const isUserRegistered = userProfile ? userProfile[4] : false;

  // Get total channel count
  const totalChannels = stats ? Number(stats[1]) : 0;

  // Auto-prompt registration when user connects wallet
  useEffect(() => {
    if (isConnected && address && !isUserRegistered && userProfile !== undefined) {
      setIsRegisterDialogOpen(true);
    }
  }, [isConnected, address, isUserRegistered, userProfile]);

  // Create channel list based on total count
  useEffect(() => {
    if (!totalChannels || totalChannels === 0) {
      setChannels([]);
      return;
    }

    // Generate channel list with IDs (channel IDs start from 0)
    const channelList = [];
    for (let i = 0; i < totalChannels; i++) {
      channelList.push({
        id: i.toString(),
        title: `Channel ${i}`, // Will be loaded by DiscussionCard
        description: '',
        messageCount: 0,
        createdBy: '',
        encrypted: true,
      });
    }

    setChannels(channelList);
  }, [totalChannels]);

  const handleRegister = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      await registerUser(username);
      toast.success('Registration transaction submitted!');
      setUsername('');
      setIsRegisterDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to register: ${error.message}`);
    }
  };

  const handleCreateChannel = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isUserRegistered) {
      toast.error('Please register first before creating a channel');
      setIsRegisterDialogOpen(true);
      return;
    }

    if (!channelName.trim() || !voteQuestion.trim()) {
      toast.error('Please enter channel name and vote question');
      return;
    }

    const validOptions = voteOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 vote options');
      return;
    }

    try {
      await createChannelWithVote(
        channelName,
        channelDescription,
        voteQuestion,
        validOptions,
        false // Single choice for now
      );
      toast.success('Channel with voting created! Transaction submitted.');
      setChannelName('');
      setChannelDescription('');
      setVoteQuestion('');
      setVoteOptions(['', '']);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to create channel: ${error.message}`);
    }
  };

  // Show success message when transaction confirms and refresh data
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Transaction confirmed successfully!');
      // Refresh user profile and stats after transaction confirmation
      setTimeout(() => {
        refetchUserProfile();
        refetchStats();
      }, 1000);
    }
  }, [isConfirmed, refetchUserProfile, refetchStats]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-pixel text-foreground mb-2 leading-relaxed">
              DISCUSSION BOARDS
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Encrypted conversations powered by FHE technology
            </p>
            {stats && (
              <p className="text-xs text-muted-foreground mt-1">
                {Number(stats[1])} channels · {Number(stats[2])} messages · {Number(stats[0])} users
              </p>
            )}
            {isConnected && userProfile && (
              <p className="text-xs text-primary mt-1">
                {isUserRegistered ? `Logged in as: ${userProfile[0]}` : 'Not registered'}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {isConnected && !isUserRegistered && (
              <Button
                onClick={() => setIsRegisterDialogOpen(true)}
                className="font-pixel text-xs bg-green-600 hover:bg-green-700 text-white border-4 border-border pixel-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                Register
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="font-pixel text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-border pixel-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  disabled={!isConnected || !isUserRegistered}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Board
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-pixel">Create Board with FHE Voting</DialogTitle>
                  <DialogDescription className="text-xs">
                    Create a discussion board with encrypted voting powered by FHE
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Board Name
                    </label>
                    <Input
                      id="name"
                      placeholder="e.g., Web3 Privacy Discussion"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description (Optional)
                    </label>
                    <Textarea
                      id="description"
                      placeholder="Describe this board..."
                      value={channelDescription}
                      onChange={(e) => setChannelDescription(e.target.value)}
                      className="border-2 min-h-[60px]"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">🔒 Encrypted Voting</p>
                    <div className="grid gap-2 mb-3">
                      <label htmlFor="voteQuestion" className="text-sm font-medium">
                        Vote Question
                      </label>
                      <Input
                        id="voteQuestion"
                        placeholder="e.g., Should we implement feature X?"
                        value={voteQuestion}
                        onChange={(e) => setVoteQuestion(e.target.value)}
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Vote Options</label>
                      {voteOptions.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...voteOptions];
                              newOptions[index] = e.target.value;
                              setVoteOptions(newOptions);
                            }}
                            className="border-2"
                          />
                          {index > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = voteOptions.filter((_, i) => i !== index);
                                setVoteOptions(newOptions);
                              }}
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                      {voteOptions.length < 10 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVoteOptions([...voteOptions, ''])}
                          className="text-xs"
                        >
                          + Add Option
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Votes will be encrypted using FHE. Nobody can see individual votes!
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleCreateChannel}
                    disabled={isPending || !channelName.trim() || !voteQuestion.trim()}
                    className="font-pixel text-xs"
                  >
                    {isPending ? 'Creating...' : 'Create Board'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Registration Dialog */}
        <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="font-pixel">Register Your Account</DialogTitle>
              <DialogDescription className="text-xs">
                Register to create channels and post messages on FHE Social
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-2"
                />
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs text-muted-foreground">
                  Your identity will be encrypted using FHE technology. Only you can prove ownership of your messages.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRegisterDialogOpen(false)}
                className="font-pixel text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleRegister}
                disabled={isPending || !username.trim()}
                className="font-pixel text-xs"
              >
                {isPending ? 'Registering...' : 'Register'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!isConnected ? (
          <div className="text-center py-16">
            <div className="bg-muted/50 border-4 border-border rounded-lg p-8 max-w-md mx-auto pixel-shadow">
              <p className="font-pixel text-sm mb-4">CONNECT WALLET</p>
              <p className="text-xs text-muted-foreground">
                Connect your wallet to view and create discussion boards
              </p>
            </div>
          </div>
        ) : !isUserRegistered ? (
          <div className="text-center py-16">
            <div className="bg-muted/50 border-4 border-border rounded-lg p-8 max-w-md mx-auto pixel-shadow">
              <p className="font-pixel text-sm mb-4">REGISTER REQUIRED</p>
              <p className="text-xs text-muted-foreground mb-6">
                You need to register before you can create channels or post messages
              </p>
              <Button
                onClick={() => setIsRegisterDialogOpen(true)}
                className="font-pixel text-xs"
              >
                Register Now
              </Button>
            </div>
          </div>
        ) : totalChannels === 0 ? (
          <div className="text-center py-16">
            <div className="bg-muted/50 border-4 border-border rounded-lg p-8 max-w-md mx-auto pixel-shadow">
              <p className="font-pixel text-sm mb-4">NO BOARDS YET</p>
              <p className="text-xs text-muted-foreground mb-6">
                Be the first to create a discussion board!
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="font-pixel text-xs"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Board
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {channels.map((channel) => (
              <DiscussionCard
                key={channel.id}
                id={channel.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
