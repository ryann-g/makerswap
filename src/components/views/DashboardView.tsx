import React, { useMemo } from 'react';
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Listing, Bounty, ListingStatus, BountyStatus } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
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
} from 'lucide-react';
import { toast } from 'sonner';

export function DashboardView() {
  const { user } = useAuth();
  const qListings = useMemo(() => {
    return user && db ? query(
      collection(db, 'listings'), 
      where('sellerId', '==', user.uid), 
      orderBy('createdAt', 'desc')
    ) : null;
  }, [user]);

  const { data: listings, loading: loadingListings } = useFirestoreCollection<Listing>(qListings, 'listings (user dashboard)');

  const qBounties = useMemo(() => {
    return user && db ? query(
      collection(db, 'bounties'), 
      where('posterId', '==', user.uid), 
      orderBy('createdAt', 'desc')
    ) : null;
  }, [user]);

  const { data: bounties, loading: loadingBounties } = useFirestoreCollection<Bounty>(qBounties, 'bounties (user dashboard)');

  const loading = loadingListings || loadingBounties;

  const handleMarkListingSold = async (id: string, currentStatus: ListingStatus) => {
    try {
      if (!db) return;
      const nextStatus = currentStatus === ListingStatus.AVAILABLE ? ListingStatus.SOLD : ListingStatus.AVAILABLE;
      
      // Atomic update for status and timestamp
      await updateDoc(doc(db, 'listings', id), { 
        status: nextStatus,
        updatedAt: serverTimestamp() 
      });
      
      toast.success(`Listing marked as ${nextStatus.toLowerCase()}`);
    } catch (error: unknown) {
      const firebaseCode = (error as { code?: string })?.code;
      console.error('[Dashboard] Update listing error:', { code: firebaseCode, error });
      toast.error('Failed to update listing status');
    }
  };

  const handleMarkBountyCompleted = async (id: string, currentStatus: BountyStatus) => {
    try {
      if (!db) return;
      const nextStatus = currentStatus === BountyStatus.OPEN ? BountyStatus.COMPLETED : BountyStatus.OPEN;
      
      await updateDoc(doc(db, 'bounties', id), { 
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      
      toast.success(`Bounty marked as ${nextStatus.toLowerCase()}`);
    } catch (error: unknown) {
      const firebaseCode = (error as { code?: string })?.code;
      console.error('[Dashboard] Update bounty error:', { code: firebaseCode, error });
      toast.error('Failed to update bounty status');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        if (!db) return;
        await deleteDoc(doc(db, 'listings', id));
        toast.success('Listing deleted');
      } catch (error: unknown) {
        const firebaseCode = (error as { code?: string })?.code;
        console.error('[Dashboard] Delete listing error:', { code: firebaseCode, error });
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleDeleteBounty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bounty? This action cannot be undone.')) {
      try {
        if (!db) return;
        await deleteDoc(doc(db, 'bounties', id));
        toast.success('Bounty deleted');
      } catch (error: unknown) {
        const firebaseCode = (error as { code?: string })?.code;
        console.error('[Dashboard] Delete bounty error:', { code: firebaseCode, error });
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
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted" />)}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(item => (
                <Card key={item.id} className={cn("transition-opacity overflow-hidden flex flex-col", item.status === ListingStatus.SOLD && "opacity-60")}>
                  {item.imageUrl && (
                    <div className="h-32 w-full overflow-hidden bg-muted relative">
                      <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                      <Badge variant={item.status === ListingStatus.AVAILABLE ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    <CardDescription>₱{item.price.toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between gap-2 border-t pt-4 mt-auto bg-muted/20">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMarkListingSold(item.id, item.status)}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {item.status === ListingStatus.AVAILABLE ? 'Mark Sold' : 'Relist'}
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
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg space-y-4">
              <Package className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">You haven't posted any items yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bounties" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Card key={i} className="h-24 animate-pulse bg-muted" />)}
            </div>
          ) : bounties.length > 0 ? (
            <div className="space-y-4">
              {bounties.map(bounty => (
                <Card key={bounty.id} className={cn("transition-opacity flex flex-col overflow-hidden", bounty.status === BountyStatus.COMPLETED && "opacity-60")}>
                  {bounty.imageUrl && (
                    <div className="h-24 w-full overflow-hidden bg-muted relative border-b">
                      <img src={bounty.imageUrl} alt={bounty.title} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{bounty.title}</CardTitle>
                      <CardDescription>Budget: ₱{bounty.budget.toLocaleString()}</CardDescription>
                    </div>
                    <Badge variant={bounty.status === BountyStatus.OPEN ? 'default' : 'secondary'}>
                      {bounty.status}
                    </Badge>
                  </CardHeader>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto bg-muted/20">
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
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg space-y-4">
              <Briefcase className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">You haven't posted any bounties yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
