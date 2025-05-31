import api from './config';
import { 
  Game, 
  User, 
  Prediction, 
  CreatePredictionDto, 
  UserBalanceAndPredictionsDto,
  UserResponseDto,
  UserListResponseDto,
  CreateUserDto,
  UpdateUserDto,
  CreatePredictionData // Legacy compatibility
} from './types';

// Games API endpoints
export const gamesAPI = {
  // Get all games
  getAllGames: async (): Promise<Game[]> => {
    const response = await api.get('/games');
    return response.data;
  },

  // Get specific game by ID  
  getGameById: async (gameId: string): Promise<Game> => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  // Get games by status
  getGamesByStatus: async (status: 'scheduled' | 'inProgress' | 'final'): Promise<Game[]> => {
    const response = await api.get(`/games/status/${status}`);
    return response.data;
  },

  // Legacy compatibility methods
  getUpcomingGames: async (): Promise<Game[]> => {
    return gamesAPI.getGamesByStatus('scheduled');
  },

  getLiveGames: async (): Promise<Game[]> => {
    return gamesAPI.getGamesByStatus('inProgress');
  },

  getFinishedGames: async (): Promise<Game[]> => {
    return gamesAPI.getGamesByStatus('final');
  },
};

// User API endpoints
export const userAPI = {
  // Get current user information using the correct endpoint
  getCurrentUser: async (): Promise<User> => {
    // Use the actual user ID and correct endpoint
    const userId = "usr123"; // This should come from auth in a real app
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get all users
  getAllUsers: async (): Promise<UserListResponseDto> => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: CreateUserDto): Promise<UserResponseDto> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId: string, userData: UpdateUserDto): Promise<UserResponseDto> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Legacy compatibility methods
  getUserStats: async (userId: string): Promise<any> => {
    // Use the correct endpoint
    const user = await userAPI.getUserById(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email || '',
      totalPredictions: user.predictions.length,
      correctPredictions: user.stats.wins,
      successRate: user.predictions.length > 0 ? (user.stats.wins / user.predictions.length) * 100 : 0,
      totalPoints: user.stats.wins * 100,
    };
  },
};

// Predictions API endpoints  
export const predictionsAPI = {
  // Create new prediction
  createPrediction: async (predictionData: CreatePredictionDto): Promise<UserBalanceAndPredictionsDto> => {
    const response = await api.post('/predictions', predictionData);
    return response.data;
  },

  // Get user predictions using the correct endpoint
  getUserPredictions: async (userId: string = "usr123"): Promise<Prediction[]> => {
    const response = await api.get(`/users/${userId}/predictions`);
    return response.data;
  },

  // Get user prediction for specific game using the correct endpoint
  getUserPredictionByGameId: async (gameId: string, userId: string = "usr123"): Promise<Prediction> => {
    const response = await api.get(`/users/${userId}/predictions/${gameId}`);
    return response.data;
  },

  // Get predictions for a specific game (legacy compatibility)
  getGamePredictions: async (gameId: string): Promise<Prediction[]> => {
    try {
      const prediction = await predictionsAPI.getUserPredictionByGameId(gameId);
      return [prediction];
    } catch (error) {
      return [];
    }
  },

  // Legacy compatibility method
  createPredictionLegacy: async (predictionData: CreatePredictionData): Promise<any> => {
    const newPrediction: CreatePredictionDto = {
      gameId: predictionData.gameId,
      pick: predictionData.prediction,
      amount: predictionData.amount || 0,
      userId: "usr123", // Add userId as required by backend
    };
    return predictionsAPI.createPrediction(newPrediction);
  },
}; 