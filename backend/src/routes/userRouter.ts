import { Router } from "express";
import { authMiddleware, userApiEndpointController, userController, userHealthCheckController} from '../dependencyInjector/userDI/userDI'
import { loginValidation, registerValidation, validateRequest } from '../validationMiddleware/registerLoginValidator' 
import { createEndpointValidation, endpointIdValidation, updateEndpointValidation } from "../validationMiddleware/apiEndpointValidator";
import { historyQueryValidation, statsQueryValidation } from "../validationMiddleware/healthCheckValidator";

const router = Router();

router.post('/register', registerValidation, validateRequest, userController.register);
router.post('/login', loginValidation, validateRequest, userController.login);
router.post('/logout', authMiddleware.authenticate, userController.logout);
router.get('/profile', authMiddleware.authenticate, userController.getCurrentUser);
router.post('/verifyOtp', userController.verifyOTP);
router.post('/resendOtp', userController.resendOTP);

router.use(authMiddleware.authenticate)

router.route('/endpoints')
  .post(createEndpointValidation, userApiEndpointController.createEndpoint)
  .get(userApiEndpointController.getUserEndpoints);

router.route('/endpoints/:endpointId')
  .get(endpointIdValidation, userApiEndpointController.getEndpointById)
  .put(updateEndpointValidation, userApiEndpointController.updateEndpoint)
  .patch(updateEndpointValidation, userApiEndpointController.updateEndpoint)
  .delete(endpointIdValidation, userApiEndpointController.deleteEndpoint);

router.patch(
  '/endpoints/:endpointId/status', 
  endpointIdValidation, 
  userApiEndpointController.toggleEndpoint
);

// health



router.get(
    '/endpoints/:endpointId/history',
    historyQueryValidation,
    userHealthCheckController.getEndpointHistory
)

router.get(
    '/endpoints/:endpointId/stats',
    statsQueryValidation,
    userHealthCheckController.getEndpointStats
)

router.post(
    '/endpoints/:endpointId/check',
    endpointIdValidation,
    userHealthCheckController.triggerManualCheck
)

export default router;