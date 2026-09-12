'use strict';

const { z } = require('zod');

const createSchema = z.object({
  productId: z.coerce.number().int().positive(),
  type: z.enum(['sell', 'rent']),
  rent_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rent_to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (d) => d.type === 'sell' || (d.rent_from && d.rent_to),
  { message: 'rent_from and rent_to are required when type=rent', path: ['rent_from'] }
);

const listQuery = z.object({
  role: z.enum(['buyer', 'seller']).default('buyer'),
});

const statusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
});

module.exports = { createSchema, listQuery, statusSchema };
