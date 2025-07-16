import { Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { APIKeyProvider } from './context/APIKeyContext';
import { PersonalizedAnswerProvider } from './context/PersonalizedAnswerContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Navbar from "./components/Navbar";
import Widget from "./page/widget";
import EmbeddingInsert from "./page/EmbeddingInsert";
import FileUpload from "./page/FileUpload";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <APIKeyProvider>
        <PersonalizedAnswerProvider>
          <SubscriptionProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Widget />} />
              <Route path="/embedding-insert" element={<EmbeddingInsert />} />
              <Route path="/file-upload" element={<FileUpload />} />
            </Routes>
          </SubscriptionProvider>
        </PersonalizedAnswerProvider>
      </APIKeyProvider>
    </AuthProvider>
  );
}

export default App;
