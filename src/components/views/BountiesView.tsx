import React, { useState, useMemo } from 'react';
import { collection, query, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';
import { Bounty, BountyStatus } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatFirestoreDate } from '@/lib/utils';
import { bountySchema, BountyFormValues } from '@/lib/schemas';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageUpload } from '@/components/common/ImageUpload';
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
  const { user, profile } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  // Zod-validated form setup
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BountyFormValues>({
    resolver: zodResolver(bountySchema),
    defaultValues: {
      title: '',
      description: '',
      budget: 0,
      imageUrl: ''
    }
  });

  const watchImageUrl = watch('imageUrl');

  const bountiesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'bounties'), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, []);

  const { data: bounties, loading } = useFirestoreCollection<Bounty>(bountiesQuery, 'bounties');

  const handleAddBounty: SubmitHandler<BountyFormValues> = async (data) => {
    if (!user || !profile || !db) return;

    try {
      await addDoc(collection(db, 'bounties'), {
        ...data,
        posterName: profile.name,
        posterId: user.uid,
        status: BountyStatus.OPEN,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'bounties'));
      
      toast.success('Bounty posted successfully!');
      setIsAdding(false);
      reset();
    } catch (error) {
      console.error('Post bounty error:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to post bounty: ${message}`);
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
              <form onSubmit={handleSubmit(handleAddBounty)} autoComplete="off">
                <DialogHeader>
                  <DialogTitle>Create New Bounty</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input 
                      id="title" 
                      {...register('title')}
                      className={cn(errors.title && "border-destructive")}
                      placeholder="e.g. Soldering help for custom PCB"
                    />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea 
                      id="desc" 
                      {...register('description')}
                      className={cn(errors.description && "border-destructive")}
                      placeholder="Explain what help you need..."
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Budget (₱)</Label>
                    <Input 
                       id="budget" 
                       type="number" 
                       {...register('budget', { valueAsNumber: true })}
                       className={cn(errors.budget && "border-destructive")}
                       placeholder="Amount you're willing to pay"
                    />
                    {errors.budget && <p className="text-xs text-destructive">{errors.budget.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>Reference Image (Optional)</Label>
                    <ImageUpload 
                      folder="bounties" 
                      currentImage={watchImageUrl} 
                      onUploadComplete={(url) => setValue('imageUrl', url)} 
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
            <Card key={bounty.id} className="group hover:border-primary/50 transition-colors overflow-hidden flex flex-col">
              {bounty.imageUrl && (
                <div className="h-32 w-full overflow-hidden bg-muted relative border-b">
                  <img src={bounty.imageUrl} alt={bounty.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
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
