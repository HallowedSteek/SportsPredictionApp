import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { userAPI, predictionsAPI, gamesAPI, User, Prediction, Game } from '@/api';
import { router } from 'expo-router';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data and recent games
      const [userData, games] = await Promise.all([
        userAPI.getCurrentUser(),
        gamesAPI.getAllGames()
      ]);
      
      setUser(userData);
      // Get only recent games (last 5)
      setRecentGames(games.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setUser(null);
      setRecentGames([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPerformanceData = () => {
    if (!user) {
      return {
        totalPredictions: 0,
        wins: 0,
        losses: 0,
        pending: 0,
        winRate: 0,
        totalEarnings: 0,
        avgBetAmount: 0
      };
    }

    const totalPredictions = user.predictions.length;
    const wins = user.stats.wins;
    const losses = user.stats.losses;
    const pending = user.stats.pending;
    const winRate = totalPredictions > 0 ? (wins / totalPredictions) * 100 : 0;
    const totalEarnings = user.predictions.reduce((sum, pred) => sum + (pred.payout || 0), 0);
    const avgBetAmount = totalPredictions > 0 ? user.predictions.reduce((sum, pred) => sum + pred.amount, 0) / totalPredictions : 0;

    return {
      totalPredictions,
      wins,
      losses,
      pending,
      winRate,
      totalEarnings,
      avgBetAmount
    };
  };

  const getWinStreakData = () => {
    if (!user) return { current: 0, best: 0 };
    
    // Calculate current win streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let i = user.predictions.length - 1; i >= 0; i--) {
      const pred = user.predictions[i];
      if (pred.result === 'win') {
        if (i === user.predictions.length - 1) currentStreak++;
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else if (pred.result === 'loss') {
        if (i === user.predictions.length - 1) currentStreak = 0;
        tempStreak = 0;
      }
    }
    
    return { current: currentStreak, best: bestStreak };
  };

  const performanceData = getPerformanceData();
  const streakData = getWinStreakData();

  // Prepare pie chart data
  const getPieChartData = () => {
    if (!user || performanceData.totalPredictions === 0) {
      return [
        {
          name: 'No Data',
          population: 1,
          color: '#666666',
          legendFontColor: '#888888',
          legendFontSize: 12,
        }
      ];
    }

    const chartData = [];
    
    if (performanceData.wins > 0) {
      chartData.push({
        name: `Wins (${performanceData.wins})`,
        population: performanceData.wins,
        color: '#00FF88',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      });
    }
    
    if (performanceData.losses > 0) {
      chartData.push({
        name: `Losses (${performanceData.losses})`,
        population: performanceData.losses,
        color: '#FF4444',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      });
    }
    
    if (performanceData.pending > 0) {
      chartData.push({
        name: `Pending (${performanceData.pending})`,
        population: performanceData.pending,
        color: '#00D4FF',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      });
    }

    return chartData;
  };

  const chartData = getPieChartData();

  const chartConfig = {
    backgroundColor: '#000000',
    backgroundGradientFrom: '#000000',
    backgroundGradientTo: '#000000',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    color = '#00FF88',
    icon 
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    color?: string; 
    icon?: string;
  }) => (
    <View style={styles.statCard}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ProgressBar = ({ 
    label, 
    value, 
    total, 
    color = '#00FF88' 
  }: { 
    label: string; 
    value: number; 
    total: number; 
    color?: string; 
  }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>{value}/{total}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.progressPercentage}>{percentage.toFixed(1)}%</Text>
      </View>
    );
  };

  const RecentActivityItem = ({ prediction }: { prediction: Prediction }) => {
    const getStatusColor = (result: string) => {
      switch (result) {
        case 'win': return '#00FF88';
        case 'loss': return '#FF4444';
        case 'pending': return '#00D4FF';
        default: return '#888888';
      }
    };

    const getStatusIcon = (result: string) => {
      switch (result) {
        case 'win': return '✅';
        case 'loss': return '❌';
        case 'pending': return '⏳';
        default: return '❓';
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityGame}>Game #{prediction.gameId}</Text>
          <View style={[styles.activityStatus, { backgroundColor: getStatusColor(prediction.result) }]}>
            <Text style={styles.activityStatusText}>
              {getStatusIcon(prediction.result)} {prediction.result.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.activityDetails}>
          <Text style={styles.activityPick}>
            Pick: <Text style={styles.activityPickValue}>{prediction.pick}</Text>
          </Text>
          <Text style={styles.activityAmount}>
            ${prediction.amount} → {prediction.payout ? `$${prediction.payout.toFixed(2)}` : 'Pending'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Text style={styles.loadingEmoji}>📊</Text>
          </View>
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
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
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <StatCard 
              title="Total Balance" 
              value={`$${performanceData.totalEarnings.toFixed(2)}`}
              subtitle={`Current: $${user?.balance.toFixed(2) || '0.00'}`}
              color="#00FF88"
              icon="💰"
            />
            <StatCard 
              title="Win Rate" 
              value={`${performanceData.winRate.toFixed(1)}%`}
              subtitle={`${performanceData.wins}/${performanceData.totalPredictions} games`}
              color="#00D4FF"
              icon="📈"
            />
          </View>
          <View style={styles.metricsGrid}>
            <StatCard 
              title="Avg Bet" 
              value={`$${performanceData.avgBetAmount.toFixed(2)}`}
              color="#A855F7"
              icon="🎯"
            />
            <StatCard 
              title="Best Streak" 
              value={streakData.best}
              subtitle={`Current: ${streakData.current}`}
              color="#FF6B35"
              icon="🔥"
            />
          </View>
        </View>

        {/* Performance Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.chartContainer}>
            {chartData.length > 0 && chartData[0].name !== 'No Data' ? (
              <PieChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute={false}
              />
            ) : (
              <View style={styles.noDataChart}>
                <Text style={styles.noDataIcon}>📊</Text>
                <Text style={styles.noDataTitle}>No Predictions Yet</Text>
                <Text style={styles.noDataSubtitle}>Start making predictions to see your performance chart</Text>
              </View>
            )}
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Breakdown</Text>
          <View style={styles.progressSection}>
            <ProgressBar 
              label="Wins" 
              value={performanceData.wins} 
              total={performanceData.totalPredictions} 
              color="#00FF88" 
            />
            <ProgressBar 
              label="Losses" 
              value={performanceData.losses} 
              total={performanceData.totalPredictions} 
              color="#FF4444" 
            />
            <ProgressBar 
              label="Pending" 
              value={performanceData.pending} 
              total={performanceData.totalPredictions} 
              color="#00D4FF" 
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {user && user.predictions.length > 0 ? (
            user.predictions.slice(-5).reverse().map((prediction, index) => (
              <RecentActivityItem key={`${prediction.gameId}_${index}`} prediction={prediction} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No Recent Activity</Text>
              <Text style={styles.emptySubtitle}>Make your first prediction to see activity here</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/games')}
            >
              <Text style={styles.actionIcon}>🎮</Text>
              <Text style={styles.actionTitle}>Browse Games</Text>
              <Text style={styles.actionSubtitle}>Find new games to bet on</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>View Profile</Text>
              <Text style={styles.actionSubtitle}>See detailed statistics</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#00FF88',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
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
  statTitle: {
    fontSize: 12,
    color: '#888888',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#888888',
  },
  progressContainer: {
    flex: 1,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#888888',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00FF88',
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: '#222222',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#00FF88',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
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
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#888888',
  },
  progressSection: {
    gap: 16,
  },
  activityItem: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityGame: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  activityDetails: {
    gap: 4,
  },
  activityPick: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  activityPickValue: {
    fontWeight: 'bold',
    color: '#00D4FF',
  },
  activityAmount: {
    fontSize: 12,
    color: '#888888',
  },
  bottomSpacing: {
    height: 32,
  },
  chartContainer: {
    alignItems: 'center',
  },
  noDataChart: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
});
