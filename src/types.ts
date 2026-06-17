/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LeadSubmission {
  id: string;
  name: string;
  mobile: string;
  email: string;
  city: 'Pune';
  societyName: string;
  vehicleType: 'Car' | 'Bike' | 'Scooter';
  interestedPlan: string;
  societySize: '10-50' | '50-100' | '100-200' | '200+';
  discountAmount: number;
  finalPrice: number;
  referralCode: string;
  createdAt: string;
  queueNumber: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  intendedFor: string;
  features: string[];
  isPopular?: boolean;
  frequency: string;
}

export interface DiagnosticProblem {
  id: string;
  text: string;
  percentage: number; // how common this is among vehicle owners
  iconName: string;
}
