export enum Category {
  SENSORS = 'SENSORS',
  MICROCONTROLLERS = 'MICROCONTROLLERS',
  ACTUATORS = 'ACTUATORS',
  PASSIVES = 'PASSIVES',
  TOOLS = 'TOOLS',
  OTHER = 'OTHER'
}

export enum Condition {
  NEW = 'NEW',
  USED = 'USED',
  SALVAGED = 'SALVAGED'
}

export enum ListingStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD'
}

export enum BountyStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface UserProfile {
  id: string; // The uid from Firestore document ID
  uid: string;
  name: string;
  email: string;
  image?: string;
  universityOrg?: string;
  bio?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  contactLink: string;
  status: ListingStatus;
  sellerId: string;
  sellerName: string;
  createdAt: string; // ISO string normalized from Firestore
  imageUrl?: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: BountyStatus;
  posterId: string;
  posterName: string;
  createdAt: string; // ISO string normalized from Firestore
  imageUrl?: string;
}


