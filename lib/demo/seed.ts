/**
 * Compatibility exports. Listings come from Google Places near the visitor.
 */
export { CATEGORY_LABELS, IMPACT_STATS } from "@/lib/places/labels";
export type { Resource, CommunityNeed, DonationLocation, VolunteerOpportunity, DemoUser } from "@/types";

export const resources: import("@/types").Resource[] = [];
export const communityNeeds: import("@/types").CommunityNeed[] = [];
export const donationLocations: import("@/types").DonationLocation[] = [];
export const volunteerOpportunities: import("@/types").VolunteerOpportunity[] = [];
export const personDropOffs = donationLocations;
export const surplusFoodPickups = donationLocations;
export const surplusFoodOrgs = resources;

export const demoUsers: import("@/types").DemoUser[] = [];
