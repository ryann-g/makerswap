import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Listing, Bounty, ListingStatus, BountyStatus } from '@/types';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Briefcase, 
  CheckCircle2, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function DashboardView() {
  const { user, getToken } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [l, b] = await Promise.all([
        api.getListings(undefined, user.uid),
        api.getBounties(user.uid)
      ]);
      setListings(l);
      setBounties(b);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleMarkListingSold = async (id: string, currentStatus: ListingStatus) => {
    try {
      const token = await getToken();
      if (!token) return;
      const nextStatus = currentStatus === ListingStatus.AVAILABLE ? ListingStatus.SOLD : ListingStatus.AVAILABLE;
      await api.updateListing(id, { status: nextStatus }, token);
      toast.success(`Listing marked as ${nextStatus.toLowerCase()}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const handleMarkBountyCompleted = async (id: string, currentStatus: BountyStatus) => {
    try {
      const token = await getToken();
      if (!token) return;
      const nextStatus = currentStatus === BountyStatus.OPEN ? BountyStatus.COMPLETED : BountyStatus.OPEN;
      await api.updateBounty(id, { status: nextStatus }, token);
      toast.success(`Bounty marked as ${nextStatus.toLowerCase()}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update bounty');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        const token = await getToken();
        if (!token) return;
        await api.deleteListing(id, token);
        toast.success('Listing deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleDeleteBounty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bounty?')) {
      try {
        const token = await getToken();
        if (!token) return;
        await api.deleteBounty(id, token);
        toast.success('Bounty deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete bounty');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">Manage your hardware listings and project bounties.</p>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="listings" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Listings
          </TabsTrigger>
          <TabsTrigger value="bounties" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            My Bounties
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="listings" className="mt-6">
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(item => (
                <Card key={item.id} className={item.status === ListingStatus.SOLD ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge variant={item.status === ListingStatus.AVAILABLE ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    <CardDescription>₱{item.price.toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between gap-2 border-t pt-4 bg-muted/20">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMarkListingSold(item.id, item.status)}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {item.status === ListingStatus.AVAILABLE ? 'Mark as Sold' : 'Mark Available'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteListing(item.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">You haven't posted any items yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bounties" className="mt-6">
          {bounties.length > 0 ? (
            <div className="space-y-4">
              {bounties.map(bounty => (
                <Card key={bounty.id} className={bounty.status === BountyStatus.COMPLETED ? 'opacity-60' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{bounty.title}</CardTitle>
                      <CardDescription>Budget: ₱{bounty.budget.toLocaleString()}</CardDescription>
                    </div>
                    <Badge variant={bounty.status === BountyStatus.OPEN ? 'default' : 'secondary'}>
                      {bounty.status}
                    </Badge>
                  </CardHeader>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-muted/20">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMarkBountyCompleted(bounty.id, bounty.status)}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {bounty.status === BountyStatus.OPEN ? 'Mark Completed' : 'Reopen'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteBounty(bounty.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">You haven't posted any bounties yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
