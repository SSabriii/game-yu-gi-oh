import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/lobby"
        element={<PrivateRoute><LobbyPage /></PrivateRoute>}
      />
      <Route
        path="/game/:roomId/:playerKey"
        element={<PrivateRoute><GamePage /></PrivateRoute>}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
