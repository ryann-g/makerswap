import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Bounty, BountyStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Clock,
  Banknote,
  Briefcase
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function BountiesView() {
  const { user, profile, getToken } = useAuth();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [newBounty, setNewBounty] = useState({
    title: '',
    description: '',
    budget: ''
  });

  const fetchBounties = async () => {
    setLoading(true);
    try {
      const data = await api.getBounties();
      setBounties(data);
    } catch (error: any) {
      console.error('Failed to load bounties:', error);
      toast.error(`Failed to load bounties: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();
  }, []);

  const handleAddBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await api.createBounty({
        ...newBounty,
        budget: parseFloat(newBounty.budget) || 0,
        posterName: profile.name,
      }, token);
      toast.success('Bounty posted successfully!');
      setIsAdding(false);
      setNewBounty({ title: '', description: '', budget: '' });
      fetchBounties();
    } catch (error) {
      toast.error('Failed to post bounty');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bounty Board</h1>
          <p className="text-muted-foreground">Post tasks or help others with their hardware projects.</p>
        </div>
        
        {user && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post Bounty
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddBounty}>
                <DialogHeader>
                  <DialogTitle>Create New Bounty</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input 
                      id="title" 
                      required 
                      value={newBounty.title} 
                      onChange={e => setNewBounty({...newBounty, title: e.target.value})}
                      placeholder="e.g. Soldering help for custom PCB"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea 
                      id="desc" 
                      required 
                      value={newBounty.description} 
                      onChange={e => setNewBounty({...newBounty, description: e.target.value})}
                      placeholder="Explain what help you need..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Budget (₱)</Label>
                    <Input 
                       id="budget" 
                       type="number" 
                       required 
                       value={newBounty.budget} 
                       onChange={e => setNewBounty({...newBounty, budget: e.target.value})}
                       placeholder="Amount you're willing to pay"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Post Bounty</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse bg-muted h-32" />
          ))}
        </div>
      ) : bounties.length > 0 ? (
        <div className="space-y-4">
          {bounties.map(bounty => (
            <Card key={bounty.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">{bounty.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Posted by {bounty.posterName}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {bounty.createdAt ? formatDistanceToNow(new Date(bounty.createdAt)) : 'Recently'} ago
                    </span>
                  </div>
                </div>
                <Badge variant={bounty.status === BountyStatus.OPEN ? 'default' : 'secondary'} className="text-sm font-bold">
                  {bounty.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">{bounty.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-muted/20 py-3">
                 <div className="flex items-center gap-2 text-primary font-bold">
                    <Banknote className="h-4 w-4" />
                    <span>₱{bounty.budget.toLocaleString()}</span>
                 </div>
                 <Button size="sm" variant="outline">View Details</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Briefcase className="h-16 w-16 text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold">No bounties yet</h3>
            <p className="text-muted-foreground">Projects are quiet today. Need help with a prototype?</p>
          </div>
          {user && (
            <Button onClick={() => setIsAdding(true)}>Post Bounty</Button>
          )}
        </div>
      )}
    </div>
  );
}
