import React from 'react';
import { Routes, Route } from 'react-router-dom';
import QuizApp from './QuizApp';

function App() {
  return (
    <Routes>
      <Route path="/*" element={<QuizApp />} />
    </Routes>
  );
}

export default App; 