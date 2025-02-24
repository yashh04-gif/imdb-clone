import React from "react";
import Navbar from "./components/Navbar.tsx";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { WatchlistProvider } from "./context/WatchlistContext.tsx";
import { RatingProvider } from './context/RatingContext';
import Home from "./Pages/Home.tsx";
import MovieList from "./Pages/MovieList.tsx";
import MovieDetails from "./Pages/MovieDetails.tsx";
import Actordetails from "./Pages/Actordetails.tsx";
import Toprated from "./Pages/Toprated.jsx";
import Watchlist from "./Pages/Watchlist.tsx";
import Profile from "./Pages/Profile.tsx";
import RecommendationsPage from "./Pages/RecommendationsPage.jsx";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <WatchlistProvider>
        <RatingProvider>
          <Router>
            <div className="min-h-screen transition-colors duration-300 dark:bg-gray-900 dark:text-white bg-white text-black">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<MovieList />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/actor/:id" element={<Actordetails />} />
                <Route path="/top-rated" element={<Toprated />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
              </Routes>
            </div>
          </Router>
        </RatingProvider>
      </WatchlistProvider>
    </ThemeProvider>
  );
}

export default App;
