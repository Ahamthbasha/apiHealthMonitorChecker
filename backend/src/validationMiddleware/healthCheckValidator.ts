
import { param, query } from "express-validator";
import { validateRequest } from "./registerLoginValidator";

export const endpointIdValidation = [
  param("endpointId").isMongoId().withMessage("Invalid endpoint ID"),
  validateRequest,
];

export const historyQueryValidation = [
  param("endpointId").isMongoId().withMessage("Invalid endpoint ID"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Limit must be between 1 and 1000"),
  validateRequest,
];

export const statsQueryValidation = [
  param("endpointId").isMongoId().withMessage("Invalid endpoint ID"),
  query("hours")
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage("Hours must be between 1 and 720"),
  validateRequest,
];

export const recentChecksValidation = [
  param("endpointId").isMongoId().withMessage("Invalid endpoint ID format"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

export const allChecksValidation = [
  param("endpointId").isMongoId().withMessage("Invalid endpoint ID format"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["all", "success", "failure", "timeout"])
    .withMessage("Invalid status filter"),
];
