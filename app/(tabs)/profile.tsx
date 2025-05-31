import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { userAPI, predictionsAPI, User, Prediction } from '@/api';

interface EnhancedUser extends User {
  virtualBalance: number;
  winStreak: number;
  bestStreak: number;
  totalEarnings: number;
  rank: string;
  totalPredictions: number;
  correctPredictions: number;
  successRate: number;
  totalPoints: number;
}

interface EnhancedPrediction extends Prediction {
  id?: string;
  outcome?: 'win' | 'loss' | 'pending';
  gameHomeTeam?: string;
  gameAwayTeam?: string;
  actualResult?: string;
  createdAt?: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [predictions, setPredictions] = useState<EnhancedPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'win' | 'loss'>('all');

  const userId = "usr123";

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Use the correct API endpoints with user ID
      const [userData, userPredictions] = await Promise.all([
        userAPI.getCurrentUser(),
        predictionsAPI.getUserPredictions("usr123")
      ]);
      
      // Enhance with additional data and calculate derived fields
      const enhancedUser: EnhancedUser = {
        ...userData,
        virtualBalance: userData.balance,
        winStreak: 3,
        bestStreak: 7,
        totalEarnings: userData.predictions.reduce((sum, pred) => sum + (pred.payout || 0), 0),
        rank: 'Silver',
        totalPredictions: userData.predictions.length,
        correctPredictions: userData.stats.wins,
        successRate: userData.predictions.length > 0 ? (userData.stats.wins / userData.predictions.length) * 100 : 0,
        totalPoints: userData.stats.wins * 100,
      };
      
      setUser(enhancedUser);
      
      // Enhance predictions with outcomes and additional data
      const enhancedPredictions: EnhancedPrediction[] = userPredictions.map((pred, index) => ({
        ...pred,
        id: `${pred.gameId}_${index}`, // Generate ID since it's not in original type
        outcome: pred.result === 'win' ? 'win' : pred.result === 'loss' ? 'loss' : 'pending',
        gameHomeTeam: pred.gameId === 'gm1003' ? 'Heat' : 'Cowboys', // Mock team names based on game ID
        gameAwayTeam: pred.gameId === 'gm1003' ? 'Lakers' : 'Giants',
        actualResult: pred.result === 'win' ? pred.pick : (pred.result === 'loss' ? 'LAL' : undefined),
        createdAt: new Date().toISOString(), // Mock timestamp
      }));
      
      setPredictions(enhancedPredictions);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const filterPredictions = (predictions: EnhancedPrediction[], filter: string) => {
    if (filter === 'all') return predictions;
    return predictions.filter(pred => pred.outcome === filter);
  };

  const getFilterCounts = () => {
    const all = predictions.length;
    const pending = predictions.filter(p => p.outcome === 'pending').length;
    const won = predictions.filter(p => p.outcome === 'win').length;
    const lost = predictions.filter(p => p.outcome === 'loss').length;
    
    return { all, pending, won, lost };
  };

  const TabButton = ({ title, value, count }: { title: string; value: typeof selectedTab; count: number }) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === value && styles.activeTab]}
      onPress={() => setSelectedTab(value)}
    >
      <Text style={[styles.tabText, selectedTab === value && styles.activeTabText]}>
        {title}
      </Text>
      <Text style={[styles.tabCount, selectedTab === value && styles.activeTabCount]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

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

  const PredictionItem = ({ prediction }: { prediction: EnhancedPrediction }) => {
    const getOutcomeColor = (outcome?: string) => {
      switch (outcome) {
        case 'win': return '#00FF88';
        case 'loss': return '#FF4444';
        case 'pending': return '#00D4FF';
        default: return '#888888';
      }
    };

    const getOutcomeIcon = (outcome?: string) => {
      switch (outcome) {
        case 'win': return '✅';
        case 'loss': return '❌';
        case 'pending': return '⏳';
        default: return '❓';
      }
    };

    return (
      <View style={styles.predictionItem}>
        <View style={styles.predictionHeader}>
          <View style={styles.predictionGameInfo}>
            <Text style={styles.predictionGame}>
              {prediction.gameHomeTeam} vs {prediction.gameAwayTeam}
            </Text>
            <Text style={styles.predictionDate}>
              {prediction.createdAt ? new Date(prediction.createdAt).toLocaleDateString() : 'Recent'}
            </Text>
          </View>
          <View style={[styles.outcomeBadge, { backgroundColor: getOutcomeColor(prediction.outcome) }]}>
            <Text style={styles.outcomeText}>
              {getOutcomeIcon(prediction.outcome)} {prediction.outcome?.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.predictionDetails}>
          <View style={styles.predictionInfo}>
            <Text style={styles.predictionText}>
              Predicted: <Text style={styles.predictionValue}>{prediction.pick.toUpperCase()}</Text>
            </Text>
            <Text style={styles.amountText}>
              Amount: ${prediction.amount || 0}
            </Text>
          </View>
          
          {prediction.outcome !== 'pending' && (
            <View style={styles.predictionResult}>
              <Text style={styles.resultText}>
                Result: <Text style={{ color: getOutcomeColor(prediction.outcome) }}>
                  {prediction.actualResult?.toUpperCase()}
                </Text>
              </Text>
              <Text style={[styles.payoutText, { color: getOutcomeColor(prediction.outcome) }]}>
                {prediction.outcome === 'win' ? '+' : ''}${(prediction.payout || 0).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const filteredPredictions = filterPredictions(predictions, selectedTab);
  const counts = getFilterCounts();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Text style={styles.loadingEmoji}>⚡</Text>
          </View>
          <Text style={styles.loadingText}>Loading Profile...</Text>
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
    
        
        {user && (
          <>
            {/* User Info Section */}
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.username.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>🏆 {user.rank} Rank</Text>
              </View>
            </View>

            {/* Balance Section */}
            <View style={styles.balanceSection}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Virtual Balance</Text>
                <Text style={styles.balanceAmount}>${user.virtualBalance.toFixed(2)}</Text>
                <Text style={styles.balanceSubtext}>
                  Total Earnings: <Text style={styles.earningsText}>+${user.totalEarnings.toFixed(2)}</Text>
                </Text>
              </View>
            </View>

            {/* Statistics Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Statistics</Text>
              <View style={styles.statsGrid}>
                <StatCard 
                  title="Predictions" 
                  value={user.totalPredictions} 
                  color="#00D4FF"
                  icon="🎯"
                />
                <StatCard 
                  title="Win Rate" 
                  value={`${user.successRate.toFixed(1)}%`} 
                  color="#00FF88"
                  icon="📈"
                />
              </View>
              <View style={styles.statsGrid}>
                <StatCard 
                  title="Win Streak" 
                  value={user.winStreak} 
                  subtitle={`Best: ${user.bestStreak}`}
                  color="#A855F7"
                  icon="🔥"
                />
                <StatCard 
                  title="Total Points" 
                  value={user.totalPoints} 
                  color="#FF6B35"
                  icon="⭐"
                />
              </View>
            </View>

            {/* Predictions History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Predictions History</Text>
              
              <View style={styles.tabSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
                  <TabButton title="All" value="all" count={counts.all} />
                  <TabButton title="Pending" value="pending" count={counts.pending} />
                  <TabButton title="Won" value="win" count={counts.won} />
                  <TabButton title="Lost" value="loss" count={counts.lost} />
                </ScrollView>
              </View>

              {filteredPredictions.length > 0 ? (
                filteredPredictions.map((prediction) => (
                  <PredictionItem key={prediction.id} prediction={prediction} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🎯</Text>
                  <Text style={styles.emptyTitle}>No Predictions Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {selectedTab === 'all' ? 'Make your first prediction!' : `No ${selectedTab} predictions yet`}
                  </Text>
                </View>
              )}
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
              >
                <Text style={styles.actionIcon}>🔔</Text>
                <Text style={styles.actionButtonText}>Notification Settings</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Alert.alert('Coming Soon', 'Account settings will be available soon')}
              >
                <Text style={styles.actionIcon}>👤</Text>
                <Text style={styles.actionButtonText}>Account Settings</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Alert.alert('Coming Soon', 'Help & Support will be available soon')}
              >
                <Text style={styles.actionIcon}>❓</Text>
                <Text style={styles.actionButtonText}>Help & Support</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacing} />
          </>
        )}
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
    paddingTop: 60,
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
  userSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF88',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 16,
  },
  rankBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  balanceSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  balanceCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00FF88',
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#888888',
  },
  earningsText: {
    color: '#00FF88',
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
    marginTop: 2,
  },
  tabSection: {
    marginBottom: 16,
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tabButton: {
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
  activeTab: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  activeTabText: {
    color: '#000000',
  },
  tabCount: {
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
  activeTabCount: {
    color: '#000000',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  predictionItem: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 16,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  predictionGameInfo: {
    flex: 1,
  },
  predictionGame: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  predictionDate: {
    fontSize: 12,
    color: '#888888',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outcomeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  predictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  predictionInfo: {
    flex: 1,
  },
  predictionText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  predictionValue: {
    fontWeight: 'bold',
    color: '#00D4FF',
  },
  amountText: {
    fontSize: 12,
    color: '#888888',
  },
  predictionResult: {
    alignItems: 'flex-end',
  },
  resultText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  payoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  actionArrow: {
    fontSize: 16,
    color: '#00D4FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
}); 