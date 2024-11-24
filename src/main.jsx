// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'
// import Navbar from './components/Navbar'
// import { ClerkProvider } from '@clerk/clerk-react'
// import { BrowserRouter, Route, Routes } from "react-router-dom";



// const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
//      <Navbar/>
//      <App />
//     </ClerkProvider>
    
//   </StrictMode>,
// )
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Navbar from "./components/Navbar";
import History from "./components/History"; // Import your History component
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <Navbar /> 
        <Routes>
          <Route path="/" element={<App />} /> 
          <Route path="/history" element={<History />} /> 
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
