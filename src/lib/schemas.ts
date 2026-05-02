import { z } from 'zod';
import { Category, Condition, ListingStatus, BountyStatus } from '../types';

/**
 * Schema for hardware listings in the marketplace.
 * Includes URL validation to prevent XSS and strict range checks for price.
 */
export const listingSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  description: z.string().min(10, "Provide a more detailed description").max(2000),
  price: z.number().min(0, "Price cannot be negative"),
  category: z.nativeEnum(Category),
  condition: z.nativeEnum(Condition),
  contactLink: z.string().url("Must be a valid URL (e.g., https://t.me/yourid)").refine(
    (url) => !url.toLowerCase().startsWith('javascript:'),
    "Invalid URL protocol"
  ),
});

/**
 * Schema for project bounties.
 * Enforces strict budget limits and task clarity.
 */
export const bountySchema = z.object({
  title: z.string().min(5, "Task title is too short").max(100),
  description: z.string().min(20, "Please explain the task in more detail").max(2000),
  budget: z.number().min(0, "Budget cannot be negative"),
});

export type ListingFormValues = z.infer<typeof listingSchema>;
export type BountyFormValues = z.infer<typeof bountySchema>;
