import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Ocean11FullBleedCommandCenter from './pages/Ocean11FullBleedCommandCenter';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<Ocean11FullBleedCommandCenter />} />
			<Route path="/Ocean11FullBleedCommandCenter" element={<Ocean11FullBleedCommandCenter />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;