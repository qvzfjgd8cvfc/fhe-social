import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, Vote, MessageSquare, Users } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How VoxCircle Works</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Privacy-preserving social platform powered by Fully Homomorphic Encryption (FHE)
          </p>
        </div>

        {/* Demo Video */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="p-6 border-4 border-border pixel-shadow bg-muted/50">
            <h2 className="text-2xl font-bold mb-4 text-center">Platform Demo</h2>
            <p className="text-center text-muted-foreground mb-6">
              Watch a quick walkthrough of VoxCircle's features
            </p>
            <div className="aspect-video bg-card border-2 border-border rounded-lg overflow-hidden">
              <video
                controls
                className="w-full h-full"
                poster="/poster.jpg"
              >
                <source src="/2025-10-30.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </Card>
        </div>

        {/* Main Steps */}
        <div className="max-w-4xl mx-auto space-y-8 mb-16">
          {/* Step 1 */}
          <Card className="p-6 border-4 border-border pixel-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Connect & Register</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Connect your Ethereum wallet (MetaMask, WalletConnect, etc.) and register with a username. 
                  Your username is stored on-chain and publicly visible.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <strong>Note:</strong> Make sure you're connected to Sepolia Testnet
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-6 border-4 border-border pixel-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Create Channels</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Create discussion channels with optional encrypted voting polls. Each channel can have:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>Custom name and description</li>
                  <li>Voting question with 2-10 options</li>
                  <li>Voting duration (1 hour to 90 days)</li>
                </ul>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <strong>Gas Cost:</strong> ~330k gas for channel creation
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-6 border-4 border-border pixel-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Vote className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Cast Encrypted Votes</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Vote on proposals using FHE encryption. Your vote choice is encrypted client-side and 
                  remains private on-chain. The system encrypts your selection (0, 1, 2...) representing 
                  the option index.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <strong>Gas Cost:</strong> ~100-150k gas per vote
                </div>
              </div>
            </div>
          </Card>

          {/* Step 4 */}
          <Card className="p-6 border-4 border-border pixel-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Post Messages</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Participate in discussions by posting messages. Messages are stored as plaintext on-chain 
                  and publicly visible. Future updates may include anonymous messaging options.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Technology Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Technology Stack</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 border-4 border-border pixel-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">Zama fhEVM</h3>
              </div>
              <p className="text-muted-foreground">
                Fully Homomorphic Encryption enables computation on encrypted data without decryption. 
                Votes remain encrypted throughout the entire process.
              </p>
            </Card>

            <Card className="p-6 border-4 border-border pixel-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">Sepolia Testnet</h3>
              </div>
              <p className="text-muted-foreground">
                Deployed on Ethereum Sepolia testnet. All transactions are verified on-chain and 
                publicly auditable via block explorers.
              </p>
            </Card>
          </div>
        </div>

        {/* Contract Info */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 border-4 border-border pixel-shadow bg-muted/50">
            <h3 className="text-xl font-semibold mb-4">Contract Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Address:</span>
                <code className="font-mono">0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span>Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solidity Version:</span>
                <span>0.8.24</span>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link to="/">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
