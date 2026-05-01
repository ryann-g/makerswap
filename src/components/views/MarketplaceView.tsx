import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Listing, Category, Condition, ListingStatus } from '@/types';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  Search, 
  Plus, 
  ExternalLink, 
  Tag, 
  ShieldCheck, 
  Clock,
  Filter,
  Package
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function MarketplaceView() {
  const { user, profile, getToken } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    price: '',
    category: Category.OTHER,
    condition: Condition.USED,
    contactLink: ''
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await api.getListings(categoryFilter === 'ALL' ? undefined : categoryFilter);
      setListings(data);
    } catch (error: any) {
      console.error('Failed to load listings:', error);
      toast.error(`Failed to load listings: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [categoryFilter]);

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await api.createListing({
        ...newListing,
        price: parseFloat(newListing.price) || 0,
        sellerName: profile.name,
      }, token);
      toast.success('Listing created successfully!');
      setIsAdding(false);
      setNewListing({
        title: '',
        description: '',
        price: '',
        category: Category.OTHER,
        condition: Condition.USED,
        contactLink: ''
      });
      fetchListings();
    } catch (error) {
      toast.error('Failed to create listing');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">Find or swap industrial components and tools.</p>
        </div>
        
        {user && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddListing}>
                <DialogHeader>
                  <DialogTitle>List Hardware</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      required 
                      value={newListing.title} 
                      onChange={e => setNewListing({...newListing, title: e.target.value})}
                      placeholder="e.g. Arduino Uno R3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea 
                      id="desc" 
                      required 
                      value={newListing.description} 
                      onChange={e => setNewListing({...newListing, description: e.target.value})}
                      placeholder="Condition details, compatibility, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price (₱)</Label>
                      <Input 
                         id="price" 
                         type="number" 
                         required 
                         value={newListing.price} 
                         onChange={e => setNewListing({...newListing, price: e.target.value})}
                         placeholder="0 for Free"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={newListing.category} 
                        onValueChange={v => setNewListing({...newListing, category: v as Category})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Category).map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select 
                        value={newListing.condition} 
                        onValueChange={v => setNewListing({...newListing, condition: v as Condition})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Condition).map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact">Contact Link (Telegram/WhatsApp)</Label>
                      <Input 
                         id="contact" 
                         type="url" 
                         required 
                         value={newListing.contactLink} 
                         onChange={e => setNewListing({...newListing, contactLink: e.target.value})}
                         placeholder="https://t.me/yourid"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Listing</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search parts, tools, sensors..." 
            className="pl-10" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as Category | 'ALL')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {Object.values(Category).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse bg-muted h-[300px]" />
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map(listing => (
            <Card key={listing.id} className="flex flex-col border-2 overflow-hidden hover:border-primary/50 transition-colors">
              <div className="bg-muted p-4 flex items-center justify-center h-32">
                <Package className="h-12 w-12 text-muted-foreground opacity-20" />
                <Badge className="absolute top-2 right-2" variant="secondary">
                  {listing.category}
                </Badge>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                  <span className="font-bold text-primary whitespace-nowrap">
                    {listing.price === 0 ? 'FREE' : `₱${listing.price.toLocaleString()}`}
                  </span>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{listing.condition}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{listing.createdAt ? formatDistanceToNow(new Date(listing.createdAt)) : 'Recently'} ago</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto border-t bg-muted/30">
                <div className="flex items-center justify-between w-full pt-4">
                  <span className="text-xs font-medium truncate max-w-[100px]">By {listing.sellerName}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    asChild
                    nativeButton={false}
                  >
                    <a href={listing.contactLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      Contact
                    </a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold">No parts found</h3>
            <p className="text-muted-foreground">Be the first to list a component in this category.</p>
          </div>
          {user && (
            <Button onClick={() => setIsAdding(true)}>Post Item</Button>
          )}
        </div>
      )}
    </div>
  );
}
