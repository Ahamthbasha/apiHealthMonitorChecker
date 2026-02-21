
import { body, param } from 'express-validator';
import { validateRequest } from './registerLoginValidator';

export const createEndpointValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Endpoint name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Invalid URL. Must include http:// or https://'),
  
  body('method')
    .optional()
    .isIn(['GET', 'POST', 'PUT', 'DELETE'])
    .withMessage('Method must be GET, POST, PUT, or DELETE'),
  
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object'),
  
  body('expectedStatus')
    .optional()
    .isInt({ min: 100, max: 599 })
    .withMessage('Expected status must be between 100 and 599'),
  
  body('interval')
    .optional()
    .isIn([60, 300, 900])
    .withMessage('Interval must be 60, 300, or 900 seconds'),
  
  body('timeout')
    .optional()
    .isInt({ min: 1000, max: 30000 })
    .withMessage('Timeout must be between 1000ms and 30000ms'),
  
  body('thresholds.maxResponseTime')
    .optional()
    .isInt({ min: 100, max: 30000 })
    .withMessage('Max response time must be between 100ms and 30000ms'),
  
  body('thresholds.failureThreshold')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Failure threshold must be between 1 and 10'),
  
  validateRequest
];

export const updateEndpointValidation = [
  param('endpointId') // Changed from 'id' to 'endpointId'
    .isMongoId()
    .withMessage('Invalid endpoint ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  
  body('url')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Invalid URL. Must include http:// or https://'),
  
  body('method')
    .optional()
    .isIn(['GET', 'POST', 'PUT', 'DELETE'])
    .withMessage('Method must be GET, POST, PUT, or DELETE'),
  
  body('expectedStatus')
    .optional()
    .isInt({ min: 100, max: 599 })
    .withMessage('Expected status must be between 100 and 599'),
  
  body('interval')
    .optional()
    .isIn([60, 300, 900])
    .withMessage('Interval must be 60, 300, or 900 seconds'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  validateRequest
];

export const endpointIdValidation = [
  param('endpointId')
    .isMongoId()
    .withMessage('Invalid endpoint ID'),
  validateRequest
];