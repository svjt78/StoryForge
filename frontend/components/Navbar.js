// components/Navbar.js
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Link href="/new-story">
            <div className="cursor-pointer">
              <Image src="/logo.svg" alt="Logo" width={80} height={80} />
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
          <Link 
            href="/stories" 
            className="text-gray-700 hover:underline transition transform hover:scale-105 hover:shadow-lg"
          >
            View Stories
          </Link>
          <Link 
            href="#" 
            className="text-gray-700 hover:underline transition transform hover:scale-105 hover:shadow-lg"
          >
            Signup
          </Link>
          <button 
            className="ml-4 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition transform hover:scale-105 hover:shadow-lg"
          >
            Artist Login
          </button>
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
        <div
          className="md:hidden bg-white shadow-md animate-fadeIn"
          style={{ animationDuration: '0.3s' }}
        >
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
            <Link 
              href="/stories" 
              onClick={() => setMobileMenuOpen(false)} 
              className="text-gray-700 hover:text-black hover:underline transition transform hover:scale-105 hover:shadow-lg"
            >
              View Stories
            </Link>
            <Link 
              href="#" 
              onClick={() => setMobileMenuOpen(false)} 
              className="text-gray-700 hover:text-black hover:underline transition transform hover:scale-105 hover:shadow-lg"
            >
              Signup
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                // Add desired functionality for Artist Login
              }}
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition transform hover:scale-105 hover:shadow-lg"
            >
              Artist Login
            </button>
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
    </header>
  );
}
