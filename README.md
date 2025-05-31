# Sports Prediction App - React Native Frontend

A modern, sleek React Native application for sports predictions with real-time game tracking and betting functionality. Built with Expo and TypeScript, featuring a professional dark theme with neon accents.

## 🚀 Features

### Core Functionality
- **Real-time Game Tracking**: Live scores, game status, and updates
- **Sports Predictions**: Place bets on game outcomes with team selection
- **User Dashboard**: Personal statistics, balance, and prediction history
- **Game Details**: Comprehensive game information with prediction interface
- **Profile Management**: User statistics, prediction history, and settings

### User Interface
- **Modern Dark Theme**: Professional black theme with neon green/cyan accents
- **Responsive Design**: Optimized for mobile devices with intuitive navigation
- **Smooth Animations**: Loading states, transitions, and interactive feedback
- **Accessibility**: High contrast colors and readable typography

### Backend Integration
- **Real API Integration**: Connected to Express.js backend with TypeScript
- **RESTful Endpoints**: Comprehensive API layer with error handling
- **Data Synchronization**: Real-time updates from backend services
- **Graceful Fallback**: Uses mock data when backend is unavailable
- **Authentication Ready**: Structured for user authentication implementation

## 🏗️ Tech Stack

- **Framework**: Expo React Native
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Styling**: StyleSheet (React Native)
- **Backend**: Express.js with TypeScript (separate repository)

## 📱 App Structure

### Screens
```
app/
├── (tabs)/
│   ├── index.tsx          # Dashboard - Game overview & quick stats
│   ├── games.tsx          # Games List - All games with filters
│   ├── profile.tsx        # Profile - User stats & prediction history
│   └── _layout.tsx        # Tab navigation layout
├── game/
│   └── [id].tsx          # Game Details - Individual game & prediction
└── _layout.tsx           # Root layout
```

### API Layer
```
api/
├── config.ts             # Axios configuration & interceptors
├── types.ts              # TypeScript interfaces
├── endpoints.ts          # API functions organized by domain
└── index.ts              # Barrel exports
```

## 🎨 Design System

### Colors
- **Primary**: `#00FF88` (Neon Green) - Success, primary actions
- **Secondary**: `#00D4FF` (Neon Cyan) - Information, secondary actions  
- **Accent**: `#A855F7` (Purple) - Highlights, special states
- **Background**: `#000000` (True Black) - Main background
- **Surface**: `#111111` (Dark Gray) - Cards, elevated surfaces
- **Border**: `#222222` (Light Gray) - Subtle borders and dividers
- **Text Primary**: `#FFFFFF` (White) - Primary text
- **Text Secondary**: `#CCCCCC` (Light Gray) - Secondary text
- **Text Tertiary**: `#888888` (Medium Gray) - Tertiary text

### Typography
- **Headers**: Bold, high contrast white text
- **Body**: Regular weight, good readability
- **Accent Text**: Neon colors for highlights and actions

## 🔌 Backend Integration

### API Endpoints

**Games**
- `GET /games` - Get all games
- `GET /games/{id}` - Get specific game details
- `GET /games/status/{status}` - Get games by status (scheduled, inProgress, final)

**User & Predictions**
- `GET /games/user` - Get current user information
- `GET /games/user/predictions` - Get user's predictions
- `GET /games/user/predictions/{gameId}` - Get user prediction for specific game
- `POST /predictions` - Create new prediction

**Users Management**
- `GET /users` - Get all users
- `POST /users` - Create new user
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Data Models

**Game Structure**
```typescript
interface Game {
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

interface Team {
  name: string;
  abbreviation: string;
  record: string;
  score?: number;
}
```

**Prediction Structure**
```typescript
interface Prediction {
  gameId: string;
  pick: string;
  amount: number;
  result: 'win' | 'loss' | 'pending';
  payout?: number;
}
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- React Native development environment
- **Backend** (optional): Sports Prediction Backend on port 3000

### Installation Steps

1. **Clone and navigate to the project**
```bash
cd SportsPredictionApp
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the backend server** (optional - app works with mock data)
```bash
# In your backend directory
npm start
# Backend should be running on http://localhost:3000
```

4. **Test backend connectivity** (optional)
```bash
node demo-api-test.js
```

5. **Start the development server**
```bash
npx expo start
```

6. **Run on device/simulator**
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w` for web version

## 🔧 Development Notes

### Backend Connection
- **With Backend**: App connects to your local backend and uses real data
- **Without Backend**: App gracefully falls back to mock data
- **Network Errors**: Handled gracefully with informative console messages

### Network Configuration

The app needs different URLs depending on where you're testing:

**🤖 Android Emulator**
```typescript
return 'http://10.0.2.2:3000/';  // Already configured
```

**🍎 iOS Simulator**
```typescript
return 'http://localhost:3000/';
```

**📱 Physical Device**
```typescript
return 'http://YOUR_COMPUTER_IP:3000/';  // Find your IP with: node get-ip.js
```

### Finding Your IP Address
Run this script to find your computer's IP for physical device testing:
```bash
node get-ip.js
```

### Backend Setup Checklist
1. ✅ **Backend running** on port 3000
2. ✅ **Correct URL** in `api/config.ts` for your testing device
3. ✅ **Same network** (for physical devices)
4. ✅ **Firewall allows** port 3000 connections

### Authentication (Future)
For authentication implementation, install AsyncStorage:
```bash
npx expo install @react-native-async-storage/async-storage
```

Then update `api/config.ts` to use AsyncStorage instead of localStorage for token storage.

## 🧪 Testing Backend Integration

A demo script is included to test the backend connectivity:

```bash
node demo-api-test.js
```

This script tests:
- Game retrieval endpoints
- User information endpoint
- Prediction creation
- Error handling

## 📁 Project Structure

```
SportsPredictionApp/
├── app/                   # Expo Router pages
│   ├── (tabs)/           # Tab navigation screens
│   ├── game/             # Game detail screens
│   └── _layout.tsx       # Root layout
├── api/                  # API layer
│   ├── config.ts         # Axios configuration
│   ├── endpoints.ts      # API functions
│   ├── types.ts          # TypeScript types
│   └── index.ts          # Exports
├── components/           # Reusable components
│   └── Themed.tsx        # Themed components
├── constants/            # App constants
├── assets/              # Images, fonts, etc.
└── demo-api-test.js     # Backend connectivity test
```

## 🔮 Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live score updates
- **User Authentication**: Login/signup with JWT tokens and AsyncStorage
- **Push Notifications**: Game reminders and result notifications
- **Social Features**: Leaderboards, friend predictions, sharing
- **Advanced Analytics**: Detailed prediction statistics and trends
- **Multiple Sports**: Expand beyond basketball to football, soccer, etc.
- **Live Streaming**: Integration with sports streaming services
- **Payment Integration**: Real money betting with payment gateways

### Technical Improvements
- **Offline Support**: Cache data for offline viewing
- **Performance**: Optimize for large datasets with pagination
- **Testing**: Comprehensive unit and integration tests
- **CI/CD**: Automated testing and deployment pipelines
- **Monitoring**: Error tracking and performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Getting Started with Development

1. **Start the Expo development server**: `npx expo start`
2. **Open on your device** using Expo Go app
3. **Backend is optional**: App works with mock data if backend isn't running
4. **Make changes** and see them reflected immediately via hot reload
5. **Test API integration** using the demo script when backend is available

The app will automatically connect to your local backend server when available, or gracefully fall back to mock data for development without a backend. 