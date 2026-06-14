import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Ocean11EscalationReports from './pages/Ocean11EscalationReports';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<Ocean11EscalationReports />} />
			<Route path="/Ocean11EscalationReports" element={<Ocean11EscalationReports />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;