'use strict';

const { z } = require('zod');

const listQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  listing_type: z.enum(['sell', 'rent']).optional(),
  city: z.string().trim().max(80).optional(),
  college: z.string().trim().max(150).optional(),
  min: z.coerce.number().nonnegative().optional(),
  max: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).default('recent'),
  seller_id: z.coerce.number().int().positive().optional(),
});

const createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(2).max(60),
  listing_type: z.enum(['sell', 'rent']),
  price: z.coerce.number().nonnegative().max(99999999),
  rent_unit: z.enum(['hour', 'day', 'week', 'month']).optional(),
  condition_tag: z.enum(['new', 'like_new', 'good', 'fair']).default('good'),
  city: z.string().trim().min(2).max(80),
  imageUrls: z.array(z.string().url().or(z.string().startsWith('/'))).optional(),
}).refine(
  (d) => d.listing_type === 'sell' || (d.listing_type === 'rent' && d.rent_unit),
  { message: 'rent_unit is required when listing_type is rent', path: ['rent_unit'] }
);

const patchSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  price: z.coerce.number().nonnegative().max(99999999).optional(),
  rent_unit: z.enum(['hour', 'day', 'week', 'month']).optional(),
  condition_tag: z.enum(['new', 'like_new', 'good', 'fair']).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  status: z.enum(['active', 'sold', 'rented', 'hidden']).optional(),
});

const reportSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});

module.exports = { listQuery, createSchema, patchSchema, reportSchema };
