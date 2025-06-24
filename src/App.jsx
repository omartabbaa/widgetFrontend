import { Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { APIKeyProvider } from './context/APIKeyContext';
import { PersonalizedAnswerProvider } from './context/PersonalizedAnswerContext';
import Navbar from "./components/Navbar";
import Widget from "./page/widget";
import EmbeddingInsert from "./page/EmbeddingInsert";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <APIKeyProvider>
        <PersonalizedAnswerProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Widget />} />
            <Route path="/embedding-insert" element={<EmbeddingInsert />} />
          </Routes>
        </PersonalizedAnswerProvider>
      </APIKeyProvider>
    </AuthProvider>
  );
}

export default App;
