import React from 'react';
import { Routes, Route } from 'react-router-dom';
import QuizApp from './QuizApp';
import './styles.css';

function App() {
  return (
    <Routes>
      <Route path="/*" element={<QuizApp />} />
    </Routes>
  );
}

export default App; 