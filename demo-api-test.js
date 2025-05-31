// Demo script to test backend API connectivity
// Run with: node demo-api-test.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🚀 Testing Sports Prediction Backend API');
  console.log('=======================================\n');

  try {
    // Test 1: Get all games
    console.log('1. Testing GET /games');
    const gamesResponse = await axios.get(`${BASE_URL}/games`);
    console.log(`✅ Success! Found ${gamesResponse.data.length} games`);
    if (gamesResponse.data.length > 0) {
      const firstGame = gamesResponse.data[0];
      console.log(`   First game: ${firstGame.homeTeam.name} vs ${firstGame.awayTeam.name}`);
      console.log(`   Status: ${firstGame.status}`);
    }
    console.log();

    // Test 2: Get games by status
    console.log('2. Testing GET /games/status/scheduled');
    const scheduledGames = await axios.get(`${BASE_URL}/games/status/scheduled`);
    console.log(`✅ Success! Found ${scheduledGames.data.length} scheduled games`);
    console.log();

    // Test 3: Get user information
    console.log('3. Testing GET /games/user');
    const userResponse = await axios.get(`${BASE_URL}/games/user`);
    console.log(`✅ Success! User: ${userResponse.data.username}`);
    console.log(`   Balance: $${userResponse.data.balance}`);
    console.log(`   Predictions: ${userResponse.data.predictions.length}`);
    console.log();

    // Test 4: Create a prediction (if there are games)
    if (gamesResponse.data.length > 0) {
      const gameId = gamesResponse.data[0].id;
      const homeTeam = gamesResponse.data[0].homeTeam.abbreviation;
      
      console.log('4. Testing POST /predictions');
      const predictionData = {
        gameId: gameId,
        pick: homeTeam,
        amount: 10
      };
      
      const predictionResponse = await axios.post(`${BASE_URL}/predictions`, predictionData);
      console.log(`✅ Success! Prediction created`);
      console.log(`   New balance: $${predictionResponse.data.balance}`);
      console.log(`   Total predictions: ${predictionResponse.data.predictions.length}`);
      console.log();
    }

    console.log('🎉 All API tests passed! Backend is ready for the frontend.');

  } catch (error) {
    console.error('❌ API Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      console.error('   No response received - is the backend running on port 3000?');
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    console.log('\n💡 Make sure your backend is running with: npm start or npm run dev');
  }
}

// Run the test
testAPI(); 