export type ResourceCategory =
  | "food"
  | "shelter"
  | "clothing"
  | "hygiene"
  | "medical"
  | "employment"
  | "transportation"
  | "legal"
  | "internet"
  | "donation";

export type VerificationStatus =
  | "verified_org"
  | "verified_moderator"
  | "community"
  | "update_requested"
  | "outdated";

export type OpenStatus =
  | "open_now"
  | "closing_soon"
  | "opens_later"
  | "appointment"
  | "unconfirmed"
  | "unavailable";

export type Urgency = "normal" | "needed_soon" | "urgent" | "critical";

export type UserRole = "guest" | "donor" | "host" | "provider" | "volunteer" | "admin";

export type Resource = {
  id: string;
  /** Google Place ID when sourced from Places API */
  placeId?: string;
  name: string;
  slug: string;
  description: string;
  category: ResourceCategory;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  /** Official Google Maps place page */
  googleMapsUri?: string;
  /** Google rating 1–5 */
  rating?: number;
  reviewCount?: number;
  /** High rating + enough reviews */
  recommended?: boolean;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  openStatus: OpenStatus;
  nextOpenLabel: string;
  walkInAllowed: boolean;
  appointmentRequired: boolean;
  idRequired: boolean;
  familyFriendly: boolean;
  petFriendly: boolean;
  wheelchairAccessible: boolean;
  languages: string[];
  essentials: string[];
  eligibility: string;
  accessibility: string;
  hours: string;
  orgName: string;
  bookingPhone?: string;
  bookingNotes?: string;
};

export type CommunityNeed = {
  id: string;
  orgName: string;
  title: string;
  description: string;
  category: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  urgency: Urgency;
  deadline: string;
  verified: boolean;
  latitude: number;
  longitude: number;
};

export type DonationLocation = {
  id: string;
  name: string;
  hostName: string;
  address: string;
  description: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "active" | "paused" | "rejected" | "closed";
  acceptedItems: string[];
  capacityStatus: "open" | "limited" | "full";
  latitude: number;
  longitude: number;
  hours: string;
};

export type VolunteerOpportunity = {
  id: string;
  title: string;
  orgName: string;
  description: string;
  location: string;
  startTime: string;
  volunteersNeeded: number;
  volunteersRegistered: number;
};

export type DemoUser = {
  email: string;
  password: string;
  name: string;
  role: Exclude<UserRole, "guest">;
  organization?: string;
};
