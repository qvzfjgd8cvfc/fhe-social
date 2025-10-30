import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFHESocial, useVoteInfo, useHasVoted } from '@/hooks/useFHESocial';
import { CONTRACTS } from '@/contracts/constants';
import { encryptUint8, initializeFHE } from '@/lib/fhe';
import { toast } from 'sonner';
import { Lock, CheckCircle2 } from 'lucide-react';

interface VotingPanelProps {
  channelId: bigint;
}

export function VotingPanel({ channelId }: VotingPanelProps) {
  const { address } = useAccount();
  const { vote, isPending, isConfirmed, hash, error: writeError } = useFHESocial();
  const { data: voteInfo } = useVoteInfo(channelId);
  const { data: hasVoted, refetch: refetchHasVoted } = useHasVoted(channelId, address);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isVoting, setIsVoting] = useState(false); // Track overall voting process
  const [lastError, setLastError] = useState<Error | null>(null);

  // Refresh vote status when transaction confirms
  useEffect(() => {
    if (isConfirmed && hash) {
      refetchHasVoted();
      setIsVoting(false); // Reset voting state on confirmation

      toast.success('Vote cast successfully! 🎉', {
        description: (
          <div className="flex flex-col gap-1">
            <span>Your encrypted vote has been recorded on-chain</span>
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
  }, [isConfirmed, hash, refetchHasVoted]);

  // Handle write errors
  useEffect(() => {
    if (writeError && writeError !== lastError) {
      setLastError(writeError);
      setIsVoting(false); // Reset voting state on error
      console.error('Vote transaction error:', writeError);

      let errorMessage = 'Transaction failed';
      if (writeError.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (writeError.message.includes('Already voted')) {
        errorMessage = 'You have already voted';
      }

      toast.error(errorMessage, {
        description: writeError.message.slice(0, 100),
      });
    }
  }, [writeError, lastError]);

  // voteInfo returns: [question, options[], startTime, endTime, active]
  if (!voteInfo || !voteInfo[4]) {
    // No active vote
    return null;
  }

  const question = voteInfo[0];
  const options = voteInfo[1];
  const startTime = Number(voteInfo[2]);
  const endTime = Number(voteInfo[3]);
  const isActive = voteInfo[4];

  const handleVote = async () => {
    if (selectedOption === null) {
      toast.error('Please select an option');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsEncrypting(true);
      setIsVoting(true); // Set voting state at the start
      setLastError(null);

      toast.info('Initializing FHE encryption...');

      // Initialize FHE
      await initializeFHE();

      toast.info('Encrypting your vote... 🔒');

      // Encrypt the vote option
      // IMPORTANT: Must encrypt with FHESocial contract address since it calls FHE.fromExternal()
      const { handle, proof } = await encryptUint8(
        selectedOption,
        CONTRACTS.FHESocial,
        address
      );

      toast.success('Vote encrypted! Submitting transaction...');

      // Cast the encrypted vote
      await vote(channelId, handle as `0x${string}`, proof as `0x${string}`);

      toast.info('Transaction submitted! Waiting for confirmation...');
    } catch (error: any) {
      console.error('Voting error:', error);
      setIsVoting(false); // Reset on error

      let errorMessage = 'Failed to vote';
      if (error.message.includes('rejected')) {
        errorMessage = 'You rejected the transaction';
      } else if (error.message.includes('Encryption')) {
        errorMessage = 'Failed to encrypt vote';
      }

      toast.error(errorMessage, {
        description: error.message.slice(0, 100),
      });
    } finally {
      setIsEncrypting(false);
    }
  };

  if (hasVoted) {
    return (
      <Card className="p-6 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">Vote Submitted</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              You have already voted in this poll. Your vote is encrypted and private.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isActive) {
    return (
      <Card className="p-6 bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <p className="text-sm text-muted-foreground">This vote has ended.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <Lock className="w-5 h-5 text-primary mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Encrypted Voting</h3>
          <p className="text-sm text-muted-foreground">
            Your vote will be encrypted using FHE. Nobody can see your choice, not even the contract owner!
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-3">{question}</h4>
        <RadioGroup
          value={selectedOption?.toString()}
          onValueChange={(value) => setSelectedOption(parseInt(value))}
        >
          <div className="space-y-2">
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <Button
        onClick={handleVote}
        disabled={selectedOption === null || isVoting}
        className="w-full"
      >
        {isEncrypting
          ? '🔒 Encrypting vote...'
          : isPending
          ? '⏳ Waiting for confirmation...'
          : isVoting
          ? '⏳ Processing...'
          : '🗳️ Cast Encrypted Vote'}
      </Button>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Powered by Zama FHE • Votes are encrypted on-chain
      </p>
    </Card>
  );
}
