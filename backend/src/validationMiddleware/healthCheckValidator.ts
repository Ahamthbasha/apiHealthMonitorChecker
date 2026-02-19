// src/validationMiddleware/healthCheckValidator.ts
import { param, query } from 'express-validator';
import { validateRequest } from './registerLoginValidator';

export const endpointIdValidation = [
  param('endpointId')
    .isMongoId()
    .withMessage('Invalid endpoint ID'),
  validateRequest
];

export const historyQueryValidation = [
  param('endpointId')
    .isMongoId()
    .withMessage('Invalid endpoint ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  validateRequest
];

export const statsQueryValidation = [
  param('endpointId')
    .isMongoId()
    .withMessage('Invalid endpoint ID'),
  query('hours')
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage('Hours must be between 1 and 720'),
  validateRequest
];