import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { gamesAPI, predictionsAPI, userAPI, Game, User } from '@/api';
import { router } from 'expo-router';
import type { CreatePredictionDto } from '@/api/types';
import { useFocusEffect } from '@react-navigation/native';

export default function GamesScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'finished'>('all');

  const fetchGames = async () => {
    try {
      setLoading(true);
      let gameData: Game[] = [];
      
      // Fetch both games and user data in parallel
      const [gamesResult, userData] = await Promise.all([
        (async () => {
          if (filter === 'all') {
            return await gamesAPI.getAllGames();
          } else if (filter === 'upcoming') {
            return await gamesAPI.getGamesByStatus('scheduled');
          } else if (filter === 'live') {
            return await gamesAPI.getGamesByStatus('inProgress');
          } else {
            return await gamesAPI.getGamesByStatus('final');
          }
        })(),
        userAPI.getCurrentUser()
      ]);
      
      setGames(gamesResult);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching games:', error);
      
      setGames([]);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGames();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchGames();
  }, [filter]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchGames();
    }, [filter])
  );

  const makePrediction = async (gameId: string, prediction: string) => {
    try {
      const predictionData: CreatePredictionDto = {
        gameId,
        pick: prediction,
        amount: 10, // Default amount
        userId: "usr123", // Add the required userId field
      };
      
      await predictionsAPI.createPrediction(predictionData);
      Alert.alert('Success! 🎉', `Prediction submitted: ${prediction.toUpperCase()}`);
      
      // Refresh games and user data to show updated state
      await fetchGames();
    } catch (error) {
      console.error('Error making prediction:', error);
      Alert.alert('Error', 'Failed to submit prediction. Please try again.');
    }
  };

  const formatDateTime = (startTime?: string) => {
    if (!startTime) return { date: 'TBD', time: 'TBD' };
    const date = new Date(startTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getFilterCounts = () => {
    const all = games.length;
    const upcoming = games.filter(g => g.status === 'scheduled').length;
    const live = games.filter(g => g.status === 'inProgress').length;
    const finished = games.filter(g => g.status === 'final').length;
    
    return { all, upcoming, live, finished };
  };

  const FilterButton = ({ title, value, count }: { title: string; value: typeof filter; count: number }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.activeFilter]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.activeFilterText]}>
        {title}
      </Text>
      <Text style={[styles.filterCount, filter === value && styles.activeFilterCount]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  const GameCard = ({ game }: { game: Game }) => {
    const { date, time } = formatDateTime(game.startTime);
    
    return (
      <TouchableOpacity 
        style={styles.gameCard}
        onPress={() => router.push(`/game/${game.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.gameHeader}>
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueText}>NBA</Text>
            <Text style={styles.sportText}>Basketball</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(game.status) }]}>
            <Text style={styles.statusText}>{game.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{game.homeTeam.abbreviation}</Text>
            <Text style={styles.teamRecord}>{game.homeTeam.record}</Text>
            {game.homeTeam.score !== undefined && (
              <Text style={styles.teamScore}>{game.homeTeam.score}</Text>
            )}
          </View>
          
          <View style={styles.vsContainer}>
            <Text style={styles.vs}>VS</Text>
            {game.status === 'inProgress' && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            {game.period && (
              <Text style={styles.periodText}>{game.period}</Text>
            )}
            {game.clock && (
              <Text style={styles.clockText}>{game.clock}</Text>
            )}
          </View>
          
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{game.awayTeam.abbreviation}</Text>
            <Text style={styles.teamRecord}>{game.awayTeam.record}</Text>
            {game.awayTeam.score !== undefined && (
              <Text style={styles.teamScore}>{game.awayTeam.score}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.gameDetails}>
          <Text style={styles.gameTime}>{date} • {time}</Text>
          {game.odds && (
            <Text style={styles.oddsText}>
              Spread: {game.odds.spread} ({game.odds.favorite})
            </Text>
          )}
          {game.winner && (
            <Text style={styles.winnerText}>Winner: {game.winner}</Text>
          )}
        </View>
        
        {game.status === 'scheduled' && (
          <View style={styles.predictionSection}>
            <Text style={styles.predictionTitle}>Quick Predict:</Text>
            <View style={styles.predictionButtons}>
              <TouchableOpacity
                style={styles.predictionButton}
                onPress={() => makePrediction(game.id, game.homeTeam.abbreviation)}
              >
                <Text style={styles.predictionButtonText}>{game.homeTeam.abbreviation}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.predictionButton}
                onPress={() => makePrediction(game.id, game.awayTeam.abbreviation)}
              >
                <Text style={styles.predictionButtonText}>{game.awayTeam.abbreviation}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inProgress': return '#00FF88';
      case 'scheduled': return '#00D4FF';
      case 'final': return '#A855F7';
      default: return '#888888';
    }
  };

  const counts = getFilterCounts();

  // Calculate user stats
  const getUserStats = () => {
    if (!user) {
      return {
        totalPredictions: 0,
        winRate: 0,
        balance: 0
      };
    }

    const totalPredictions = user.predictions.length;
    const winRate = totalPredictions > 0 ? (user.stats.wins / totalPredictions) * 100 : 0;
    
    return {
      totalPredictions,
      winRate,
      balance: user.balance
    };
  };

  const userStats = getUserStats();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Text style={styles.loadingEmoji}>⚡</Text>
          </View>
          <Text style={styles.loadingText}>Loading Games...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statValue}>{userStats.totalPredictions}</Text>
              <Text style={styles.statLabel}>Predictions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={styles.statValue}>{userStats.winRate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>${userStats.balance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            <FilterButton title="All" value="all" count={counts.all} />
            <FilterButton title="Upcoming" value="upcoming" count={counts.upcoming} />
            <FilterButton title="Live" value="live" count={counts.live} />
            <FilterButton title="Finished" value="finished" count={counts.finished} />
          </ScrollView>
        </View>

        <View style={styles.gamesSection}>
          {games.length > 0 ? (
            games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No Games Found</Text>
              <Text style={styles.emptySubtitle}>Try selecting a different filter or refresh</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  loadingEmoji: {
    fontSize: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
  },
  filterSection: {
    paddingBottom: 24,
  },
  filterScrollView: {
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#222222',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFilter: {
    backgroundColor: '#00FF88',
    borderColor: '#00FF88',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  activeFilterText: {
    color: '#000000',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
    backgroundColor: '#222222',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  activeFilterCount: {
    color: '#000000',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gamesSection: {
    paddingHorizontal: 20,
  },
  gameCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D4FF',
    marginBottom: 2,
  },
  sportText: {
    fontSize: 12,
    color: '#888888',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamRecord: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  teamScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF88',
  },
  vsContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  vs: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0040',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    marginBottom: 2,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  periodText: {
    fontSize: 10,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  clockText: {
    fontSize: 10,
    color: '#00FF88',
  },
  gameDetails: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gameTime: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  oddsText: {
    fontSize: 12,
    color: '#00D4FF',
    marginBottom: 2,
  },
  winnerText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: 'bold',
  },
  predictionSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#00FF88',
  },
  predictionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  predictionButton: {
    flex: 1,
    backgroundColor: '#00D4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  predictionButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
}); 