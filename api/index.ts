// Export API endpoints
export { gamesAPI, predictionsAPI, userAPI } from './endpoints';

// Export types
export type { Game, Prediction, CreatePredictionData, User } from './types';

// Export axios instance for custom requests
export { default as api } from './config'; 