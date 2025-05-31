import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, router } from 'expo-router';
import { gamesAPI, predictionsAPI, Game } from '@/api';
import type { CreatePredictionDto } from '@/api/types';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [predictionAmount, setPredictionAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGameDetails();
    }
  }, [id]);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const gameData = await gamesAPI.getGameById(id as string);
      setGame(gameData);
    } catch (error) {
      console.error('Error fetching game details:', error);
      setGame(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionSubmit = async () => {
    if (!selectedPrediction) {
      Alert.alert('Error', 'Please select a prediction');
      return;
    }

    if (!predictionAmount || parseFloat(predictionAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const predictionData: CreatePredictionDto = {
        gameId: id as string,
        pick: selectedPrediction,
        amount: parseFloat(predictionAmount),
        userId: "usr123",
      };

      const result = await predictionsAPI.createPrediction(predictionData);
      
      Alert.alert(
        'Prediction Submitted! 🎉',
        `You predicted ${selectedPrediction.toUpperCase()} with $${predictionAmount}!\nNew Balance: $${result.balance.toFixed(2)}`,
        [
          {
            text: 'View More Games',
            onPress: () => router.push('/(tabs)/games'),
          },
          {
            text: 'Back to Dashboard',
            onPress: () => router.push('/(tabs)'),
            style: 'default',
          },
        ]
      );

      // Reset form
      setSelectedPrediction(null);
      setPredictionAmount('');
    } catch (error) {
      console.error('Error submitting prediction:', error);
      Alert.alert('Error', 'Failed to submit prediction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#00D4FF';
      case 'inProgress': return '#00FF88';
      case 'final': return '#A855F7';
      default: return '#00D4FF';
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

  const getOdds = (team: string) => {
    if (!game?.odds) return 2.0;
    
    // Simple odds calculation based on spread
    if (team === game.odds.favorite) {
      return 1.85; // Favorite has lower odds
    } else {
      return 2.10; // Underdog has higher odds
    }
  };

  const PredictionButton = ({ 
    type, 
    teamName, 
    odds 
  }: { 
    type: string; 
    teamName: string; 
    odds: number; 
  }) => (
    <TouchableOpacity
      style={[
        styles.predictionButton,
        selectedPrediction === type && styles.selectedPrediction
      ]}
      onPress={() => setSelectedPrediction(type)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.predictionTeam,
        selectedPrediction === type && styles.selectedText
      ]}>
        {teamName}
      </Text>
      <Text style={[
        styles.predictionOdds,
        selectedPrediction === type && styles.selectedText
      ]}>
        {odds.toFixed(2)}x
      </Text>
      {selectedPrediction === type && (
        <View style={styles.selectedIndicator} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Text style={styles.loadingEmoji}>⚡</Text>
          </View>
          <Text style={styles.loadingText}>Loading Game Details...</Text>
        </View>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Game not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { date, time } = formatDateTime(game.startTime);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(game.status) }]}>
            <Text style={styles.statusText}>{game.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Game Info */}
        <View style={styles.gameInfo}>
          <Text style={styles.leagueText}>NBA • Basketball</Text>
          <Text style={styles.dateText}>{date} at {time}</Text>
          {game.odds && (
            <Text style={styles.oddsInfo}>
              Spread: {game.odds.spread} (Favorite: {game.odds.favorite})
            </Text>
          )}
        </View>

        {/* Teams */}
        <View style={styles.teamsSection}>
          <View style={styles.teamContainer}>
            <Text style={styles.teamLogo}>🏀</Text>
            <Text style={styles.teamName}>{game.homeTeam.name}</Text>
            <Text style={styles.teamAbbr}>{game.homeTeam.abbreviation}</Text>
            <Text style={styles.teamRecord}>{game.homeTeam.record}</Text>
            <Text style={styles.teamLabel}>HOME</Text>
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

          <View style={styles.teamContainer}>
            <Text style={styles.teamLogo}>🏀</Text>
            <Text style={styles.teamName}>{game.awayTeam.name}</Text>
            <Text style={styles.teamAbbr}>{game.awayTeam.abbreviation}</Text>
            <Text style={styles.teamRecord}>{game.awayTeam.record}</Text>
            <Text style={styles.teamLabel}>AWAY</Text>
            {game.awayTeam.score !== undefined && (
              <Text style={styles.teamScore}>{game.awayTeam.score}</Text>
            )}
          </View>
        </View>

        {/* Prediction Section */}
        {game.status === 'scheduled' && (
          <View style={styles.predictionSection}>
            <Text style={styles.sectionTitle}>Make Your Prediction</Text>
            
            <View style={styles.predictionsContainer}>
              <PredictionButton 
                type={game.homeTeam.abbreviation} 
                teamName={`${game.homeTeam.abbreviation} Win`} 
                odds={getOdds(game.homeTeam.abbreviation)} 
              />
              <PredictionButton 
                type={game.awayTeam.abbreviation} 
                teamName={`${game.awayTeam.abbreviation} Win`} 
                odds={getOdds(game.awayTeam.abbreviation)} 
              />
            </View>

            {selectedPrediction && (
              <View style={styles.predictionForm}>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Bet Amount ($)</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={predictionAmount}
                    onChangeText={setPredictionAmount}
                    placeholder="Enter amount"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.predictionSummary}>
                  <Text style={styles.summaryText}>
                    Predicting <Text style={styles.highlightText}>{selectedPrediction}</Text> with 
                    <Text style={styles.highlightText}> ${predictionAmount || '0'}</Text>
                  </Text>
                  <Text style={styles.potentialWin}>
                    Potential Win: ${((parseFloat(predictionAmount) || 0) * getOdds(selectedPrediction)).toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handlePredictionSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Submitting...' : 'Submit Prediction'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Game Result */}
        {game.status === 'final' && game.winner && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Final Result</Text>
            <View style={styles.finalScore}>
              <Text style={styles.finalScoreText}>
                Winner: {game.winner}
              </Text>
              {game.homeTeam.score !== undefined && game.awayTeam.score !== undefined && (
                <Text style={styles.scoreText}>
                  {game.homeTeam.abbreviation} {game.homeTeam.score} - {game.awayTeam.score} {game.awayTeam.abbreviation}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  gameInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  leagueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D4FF',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  oddsInfo: {
    fontSize: 14,
    color: '#888888',
  },
  teamsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 48,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamAbbr: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: 4,
  },
  teamRecord: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  teamLabel: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 12,
  },
  teamScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00FF88',
  },
  vsContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0040',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  periodText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  clockText: {
    fontSize: 12,
    color: '#00FF88',
  },
  predictionSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  predictionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  predictionButton: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  selectedPrediction: {
    borderColor: '#00FF88',
    backgroundColor: '#001a0a',
  },
  predictionTeam: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  predictionOdds: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4FF',
  },
  selectedText: {
    color: '#00FF88',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF88',
  },
  predictionForm: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  predictionSummary: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  summaryText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 8,
  },
  highlightText: {
    color: '#00FF88',
    fontWeight: 'bold',
  },
  potentialWin: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4FF',
  },
  submitButton: {
    backgroundColor: '#00FF88',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333333',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  resultSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  finalScore: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
    alignItems: 'center',
  },
  finalScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A855F7',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  bottomSpacing: {
    height: 40,
  },
}); 