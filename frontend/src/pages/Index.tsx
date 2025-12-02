import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
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
import { useFHESocial, useUser, useChannelCount } from '@/hooks/useFHESocial';
import { toast } from 'sonner';

const Index = () => {
  const { address, isConnected } = useAccount();
  const { register, createChannelWithVote, isPending, isConfirmed, hash, error: writeError } = useFHESocial();
  const { data: userData, refetch: refetchUser } = useUser(address);
  const { data: channelCount, refetch: refetchChannelCount } = useChannelCount();

  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [voteDuration, setVoteDuration] = useState('7'); // days
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [pendingAction, setPendingAction] = useState<'register' | 'createChannel' | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Check if user is registered
  const isUserRegistered = userData ? userData[1] : false; // userData = [username, registered, registeredAt]
  const userUsername = userData ? userData[0] : '';

  // Get total channel count
  const totalChannels = channelCount ? Number(channelCount) : 0;

  // Auto-prompt registration when user connects wallet
  useEffect(() => {
    if (isConnected && address && !isUserRegistered && userData !== undefined) {
      setIsRegisterDialogOpen(true);
    }
  }, [isConnected, address, isUserRegistered, userData]);

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
      toast.info('Please confirm the transaction in your wallet...');
      setPendingAction('register');
      await register(username);
      toast.success('Registration transaction submitted! Waiting for confirmation...');
      // Don't close dialog yet - wait for isConfirmed
    } catch (error: any) {
      console.error('Registration error:', error);
      setPendingAction(null);
      if (error.message.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Failed to register: ${error.message}`);
      }
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

    if (!channelName.trim()) {
      toast.error('Please enter channel name');
      return;
    }

    if (!voteQuestion.trim()) {
      toast.error('Please provide a vote question');
      return;
    }

    const validOptions = voteOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 vote options');
      return;
    }

    try {
      toast.info('Please confirm the transaction in your wallet...');
      setPendingAction('createChannel');
      const durationSeconds = BigInt(Number(voteDuration) * 24 * 60 * 60);
      await createChannelWithVote(channelName, channelDescription, voteQuestion, validOptions, durationSeconds);
      toast.success('Channel & vote creation submitted! Waiting for confirmation...');
      // Don't close dialog yet - wait for isConfirmed
    } catch (error: any) {
      console.error('Create channel error:', error);
      setPendingAction(null);
      if (error.message.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Failed to create channel: ${error.message}`);
      }
    }
  };


  // Show success message when transaction confirms and refresh data
  useEffect(() => {
    if (isConfirmed && pendingAction && hash) {
      const actionLabel = pendingAction === 'register' ? 'Registration' : 'Channel creation';
      toast.success(`${actionLabel} confirmed!`, {
        description: (
          <div className="flex flex-col gap-1">
            <span>Transaction has been confirmed on-chain</span>
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

      // Close the appropriate dialog based on pending action
      if (pendingAction === 'register') {
        setUsername('');
        setIsRegisterDialogOpen(false);
      } else if (pendingAction === 'createChannel') {
        setChannelName('');
        setChannelDescription('');
        setVoteQuestion('');
        setVoteOptions(['', '']);
        setVoteDuration('7');
        setIsDialogOpen(false);
      }

      // Clear pending action
      setPendingAction(null);

      // Refresh user profile and channel count after transaction confirmation
      setTimeout(() => {
        refetchUser();
        refetchChannelCount();
      }, 1000);
    }
  }, [isConfirmed, pendingAction, hash, refetchUser, refetchChannelCount]);

  // Handle write errors
  useEffect(() => {
    if (writeError && writeError !== lastError) {
      setLastError(writeError);
      setPendingAction(null);

      let errorMessage = 'Transaction failed';
      if (writeError.message.includes('user rejected') || writeError.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (writeError.message.includes('Already registered')) {
        errorMessage = 'You are already registered';
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
  }, [writeError, lastError, hash]);

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
            <p className="text-xs text-muted-foreground mt-1">
              {totalChannels} channels
            </p>
            {isConnected && userData && (
              <p className="text-xs text-primary mt-1">
                {isUserRegistered ? `Logged in as: ${userUsername}` : 'Not registered'}
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
                    Create a discussion board with optional encrypted voting powered by FHE
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Board Name *
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
                      Description
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
                    <p className="text-sm font-medium mb-2">🔒 Encrypted Voting (Optional)</p>
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
                    {voteQuestion.trim() && (
                      <>
                        <div className="grid gap-2 mb-3">
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
                        <div className="grid gap-2 mb-2">
                          <label htmlFor="duration" className="text-sm font-medium">
                            Vote Duration (days)
                          </label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            max="90"
                            value={voteDuration}
                            onChange={(e) => setVoteDuration(e.target.value)}
                            className="border-2"
                          />
                        </div>
                      </>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Votes will be encrypted using FHE. Nobody can see individual votes!
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleCreateChannel}
                    disabled={isPending || pendingAction === 'createChannel' || !channelName.trim()}
                    className="font-pixel text-xs"
                  >
                    {isPending && pendingAction === 'createChannel' ? 'Confirming...' : 'Create Board'}
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
                Register to create channels and post messages on VoxCircle
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
                  Registration is required to participate in discussions. Your username will be publicly visible.
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
                disabled={isPending || pendingAction === 'register' || !username.trim()}
                className="font-pixel text-xs"
              >
                {isPending && pendingAction === 'register' ? 'Confirming...' : 'Register'}
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
