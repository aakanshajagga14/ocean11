import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Ocean11RefinedAlertsPage from './pages/Ocean11RefinedAlertsPage';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<Ocean11RefinedAlertsPage />} />
			<Route path="/Ocean11RefinedAlertsPage" element={<Ocean11RefinedAlertsPage />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;