import { z } from 'zod'
import { CargoType, UrgencyLevel, CargoStatus } from './types'

// Cargo creation schema for validation
export const cargoCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  type: z.nativeEnum(CargoType, {
    errorMap: () => ({ message: 'Please select a valid cargo type' })
  }),
  
  urgency: z.nativeEnum(UrgencyLevel, {
    errorMap: () => ({ message: 'Please select urgency level' })
  }),

  weight: z.number()
    .positive('Weight must be positive')
    .max(50000, 'Weight cannot exceed 50,000 kg'),

  volume: z.number()
    .positive('Volume must be positive')
    .max(1000, 'Volume cannot exceed 1,000 m³')
    .optional(),

  fromAddress: z.string()
    .min(1, 'From address is required')
    .max(500, 'Address too long'),

  fromCountry: z.string()
    .min(1, 'From country is required')
    .max(100, 'Country name too long'),

  fromPostal: z.string()
    .min(4, 'Postal code must be at least 4 characters')
    .max(10, 'Postal code too long')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid postal code format'),

  fromCity: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(100, 'City name too long'),

  toAddress: z.string()
    .min(1, 'To address is required')
    .max(500, 'Address too long'),

  toCountry: z.string()
    .min(1, 'To country is required')
    .max(100, 'Country name too long'),

  toPostal: z.string()
    .min(4, 'Postal code must be at least 4 characters')
    .max(10, 'Postal code too long')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid postal code format'),

  toCity: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(100, 'City name too long'),

  loadingDate: z.string()
    .min(1, 'Loading date is required')
    .refine((date: string) => {
      const loadDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return loadDate >= today
    }, 'Loading date cannot be in the past'),

  deliveryDate: z.string()
    .min(1, 'Delivery date is required'),

  totalPrice: z.number()
    .positive('Price must be positive')
    .max(1000000, 'Price too high')
    .optional(),

  providerName: z.string()
    .min(1, 'Provider name is required')
    .max(200, 'Provider name too long'),

  providerStatus: z.string()
    .min(1, 'Provider status is required')
}).refine((data: any) => {
  const loadDate = new Date(data.loadingDate)
  const deliveryDate = new Date(data.deliveryDate)
  return deliveryDate > loadDate
}, {
  message: 'Delivery date must be after loading date',
  path: ['deliveryDate']
})

// Offer request schema
export const offerRequestSchema = z.object({
  cargoId: z.string().min(1, 'Cargo ID is required'),
  providerName: z.string().min(1, 'Provider name is required'),
  proposedPrice: z.number().positive('Price must be positive'),
  message: z.string().max(1000, 'Message too long').optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).optional()
})

// Marketplace filters schema
export const marketplaceFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  country: z.string().optional(),
  sortBy: z.enum(['newest', 'price-low', 'price-high', 'weight-low', 'weight-high', 'urgency']).optional(),
  cargoType: z.nativeEnum(CargoType).optional(),
  urgency: z.nativeEnum(UrgencyLevel).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional()
})

// Cargo update schema
export const cargoUpdateSchema = z.object({
  status: z.nativeEnum(CargoStatus).optional(),
  totalPrice: z.number().positive().optional()
})

// User creation schema
export const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  company: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional()
})

// TypeScript type inference
export type CargoCreateInput = z.infer<typeof cargoCreateSchema>
export type OfferRequestInput = z.infer<typeof offerRequestSchema>
export type MarketplaceFilters = z.infer<typeof marketplaceFiltersSchema>
export type CargoUpdateInput = z.infer<typeof cargoUpdateSchema>
export type UserCreateInput = z.infer<typeof userCreateSchema>