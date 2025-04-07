// components/Navbar.js
import { useState, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import { AuthContext } from './AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  // Updated: use userId instead of username
  const { isAuthenticated, userId, logout } = useContext(AuthContext);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log off?")) {
      logout();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Link href="/new-story">
            <div className="cursor-pointer flex items-center">
              <Image src="/logo.svg" alt="Logo" width={80} height={80} />
              {isAuthenticated && (
                <span className="ml-2 text-gray-700 font-medium">
                  Welcome {userId}
                </span>
              )}
            </div>
          </Link>
        </div>
        {/* Desktop Navbar */}
        <nav className="hidden md:flex space-x-6 items-center">
          <Link
            href="#"
            className="text-gray-700 hover:underline transition transform hover:scale-105 hover:shadow-lg"
          >
            Our Pricing
          </Link>
          <Link
            href="/new-story"
            className="text-gray-700 hover:underline transition transform hover:scale-105 hover:shadow-lg"
          >
            New Story
          </Link>
          {isAuthenticated ? (
            <Link
              href="/stories"
              className="text-gray-700 hover:underline transition transform hover:scale-105 hover:shadow-lg"
            >
              View Stories
            </Link>
          ) : (
            <span
              onClick={() => alert("Please Login")}
              className="text-gray-400 cursor-not-allowed"
            >
              View Stories
            </span>
          )}
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => setShowSignupModal(true)}
                className="text-gray-700 hover:underline transition transform hover:scale-105 hover:shadow-lg"
              >
                Signup
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="ml-4 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition transform hover:scale-105 hover:shadow-lg"
              >
                Author Login
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition transform hover:scale-105 hover:shadow-lg"
            >
              Logoff
            </button>
          )}
        </nav>
        {/* Mobile Burger Icon */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-gray-700 hover:text-black transition transform hover:scale-105 focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md animate-fadeIn" style={{ animationDuration: '0.3s' }}>
          <nav className="flex flex-col space-y-2 px-4 py-3">
            <Link
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-700 hover:text-black hover:underline transition transform hover:scale-105 hover:shadow-lg"
            >
              Our Pricing
            </Link>
            <Link
              href="/new-story"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-700 hover:text-black hover:underline transition transform hover:scale-105 hover:shadow-lg"
            >
              New Story
            </Link>
            {isAuthenticated ? (
              <Link
                href="/stories"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-black hover:underline transition transform hover:scale-105 hover:shadow-lg"
              >
                View Stories
              </Link>
            ) : (
              <span
                onClick={() => {
                  setMobileMenuOpen(false);
                  alert("Please Login");
                }}
                className="text-gray-400 cursor-not-allowed"
              >
                View Stories
              </span>
            )}
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignupModal(true);
                  }}
                  className="text-gray-700 hover:text-black hover:underline transition transform hover:scale-105 hover:shadow-lg"
                >
                  Signup
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLoginModal(true);
                  }}
                  className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition transform hover:scale-105 hover:shadow-lg"
                >
                  Author Login
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition transform hover:scale-105 hover:shadow-lg"
                >
                  Logoff
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation-name: fadeIn;
        }
      `}</style>
      <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <SignupModal 
        show={showSignupModal} 
        onClose={() => setShowSignupModal(false)} 
        onSuccess={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </header>
  );
}
