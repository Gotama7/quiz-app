import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QuizApp from './QuizApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuizApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 