import React, { useState, useEffect } from 'react';
import { Film, Menu, X, Star, Bookmark, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from "../context/ThemeContext.tsx";
import SearchBar from './SearchBar.tsx';
import LoginModal from './LoginModal.tsx';
import SignupModal from './SignupModal.tsx';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Movies', path: '/movies' },
    { label: 'Recommmendation', path: '/recommendations' },
    { label: 'Top Rated', path: '/top-rated' },
    { label: 'Watchlist', path: '/watchlist', icon: <Bookmark className="w-4 h-4" /> },
    user ? { label: 'Profile', path: '/profile', icon: <User className="w-4 h-4" /> } : null
  ].filter(Boolean);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <nav className={`${theme.cardBg} border-b ${theme.border} sticky top-0 z-50 shadow-lg backdrop-blur-md bg-opacity-90`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side: logo and search bar */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Film className="w-8 h-8 text-yellow-400" />
              <span className="text-xl font-bold text-yellow-400">MovieDB</span>
            </Link>
            <SearchBar />
          </div>
          {/* Desktop navigation items */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => item && (
              <Link
                key={item.label}
                to={item.path}
                className={`${theme.text} hover:text-yellow-400 transition-colors flex items-center gap-2 font-medium`}
              >
                {item.icon && <span className="text-yellow-400">{item.icon}</span>}
                {item.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${theme.cardBg} ${theme.text} hover:bg-opacity-80 transition-all duration-300 shadow-md`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition shadow-md font-medium"
              >
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 transition shadow-md font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${theme.text} hover:text-yellow-400 transition-colors`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => item && (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`${theme.text} hover:text-yellow-400 transition-colors flex items-center gap-2 font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <span className="text-yellow-400">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${theme.cardBg} ${theme.text} hover:bg-opacity-80 transition-all duration-300 shadow-md`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? '🌞' : '🌙'}
              </button>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition shadow-md font-medium"
                >
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setIsMenuOpen(false);
                    }}
                    className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 transition shadow-md font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setShowSignup(true);
                      setIsMenuOpen(false);
                    }}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md font-medium"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showLogin && (
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}
      {showSignup && (
        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
