import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';
import { Listing, Category, Condition, ListingStatus } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatFirestoreDate } from '@/lib/utils';
import { listingSchema, ListingFormValues } from '@/lib/schemas';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  ShieldCheck, 
  Clock,
  Filter,
  Package
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function MarketplaceView() {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [isAdding, setIsAdding] = useState(false);

  // Zod-validated form setup for robust data entry
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: Category.OTHER,
      condition: Condition.USED,
      contactLink: ''
    }
  });

  const categoryValue = watch('category');
  const conditionValue = watch('condition');

  const listingsQuery = useMemo(() => {
    if (!db) return null;
    if (categoryFilter !== 'ALL') {
      return query(collection(db, 'listings'), where('category', '==', categoryFilter), orderBy('createdAt', 'desc'));
    }
    return query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
  }, [categoryFilter]);

  const { data: listings, loading } = useFirestoreCollection<Listing>(listingsQuery, 'listings');

  // Performance: Memoize filtered results to prevent expensive re-calculates on every render
  const filteredListings = useMemo(() => {
    const term = search.toLowerCase();
    return listings.filter(l => 
      l.title.toLowerCase().includes(term) || 
      l.description.toLowerCase().includes(term)
    );
  }, [listings, search]);

  const handleAddListing: SubmitHandler<ListingFormValues> = async (data) => {
    if (!user || !profile || !db) return;

    try {
      await addDoc(collection(db, 'listings'), {
        ...data,
        sellerName: profile.name,
        sellerId: user.uid,
        status: ListingStatus.AVAILABLE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'listings'));
      
      toast.success('Listing created successfully!');
      setIsAdding(false);
      reset();
    } catch (error) {
      console.error('Create listing error:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to create listing: ${message}`);
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
              <form onSubmit={handleSubmit(handleAddListing)}>
                <DialogHeader>
                  <DialogTitle>List Hardware</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      {...register('title')}
                      className={cn(errors.title && "border-destructive")}
                      placeholder="e.g. Arduino Uno R3"
                    />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea 
                      id="desc" 
                      {...register('description')}
                      className={cn(errors.description && "border-destructive")}
                      placeholder="Condition details, compatibility, etc."
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price (₱)</Label>
                      <Input 
                         id="price" 
                         type="number" 
                         {...register('price', { valueAsNumber: true })}
                         className={cn(errors.price && "border-destructive")}
                      />
                      {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={categoryValue} 
                        onValueChange={v => setValue('category', v as Category)}
                      >
                        <SelectTrigger className={cn(errors.category && "border-destructive")}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Category).map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select 
                        value={conditionValue} 
                        onValueChange={v => setValue('condition', v as Condition)}
                      >
                        <SelectTrigger className={cn(errors.condition && "border-destructive")}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Condition).map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.condition && <p className="text-xs text-destructive">{errors.condition.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact">Contact Link</Label>
                      <Input 
                         id="contact" 
                         type="url" 
                         {...register('contactLink')}
                         className={cn(errors.contactLink && "border-destructive")}
                         placeholder="https://t.me/yourid"
                      />
                      {errors.contactLink && <p className="text-xs text-destructive">{errors.contactLink.message}</p>}
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
              <div className="bg-muted p-4 flex items-center justify-center h-32 relative">
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
                  >
                    <a href={listing.contactLink?.startsWith('http') ? listing.contactLink : '#'} target="_blank" rel="noopener noreferrer">
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
