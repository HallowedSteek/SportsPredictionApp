// Types matching the backend swagger schema

export interface Team {
  name: string;
  abbreviation: string;
  record: string;
  score?: number;
}

export interface Odds {
  spread: string;
  favorite: string;
}

export interface Game {
  id: string;
  status: 'scheduled' | 'inProgress' | 'final';
  startTime?: string;
  period?: string;
  clock?: string;
  homeTeam: Team;
  awayTeam: Team;
  odds?: Odds;
  winner?: string;
}

export interface Prediction {
  gameId: string;
  userId: string;
  pick: string;
  amount: number;
  result: 'win' | 'loss' | 'pending';
  payout?: number;
}

export interface UserStats {
  wins: number;
  losses: number;
  pending: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  balance: number;
  predictions: Prediction[];
  stats: UserStats;
}

export interface PredictionResponseDto {
  gameId: string;
  userId: string;
  pick: string;
  amount: number;
  result: 'win' | 'loss' | 'pending';
  payout?: number;
}

export interface UserBalanceAndPredictionsDto {
  balance: number;
  predictions: PredictionResponseDto[];
  stats: {
    pending: number;
    losses: number;
    wins: number;
  };
}

export interface CreatePredictionDto {
  gameId: string;
  pick: string;
  amount: number;
  userId: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponseDto {
  users: UserResponseDto[];
  total: number;
}

export interface CreateUserDto {
  email: string;
  name: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
}

// Legacy types for compatibility (will be gradually removed)
export interface CreatePredictionData {
  gameId: string;
  prediction: string;
  confidence?: number;
  amount?: number;
} 