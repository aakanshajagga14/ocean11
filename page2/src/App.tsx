import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Ocean11InvestigationsDashboard from './pages/Ocean11InvestigationsDashboard';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<Ocean11InvestigationsDashboard />} />
			<Route path="/Ocean11InvestigationsDashboard" element={<Ocean11InvestigationsDashboard />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;