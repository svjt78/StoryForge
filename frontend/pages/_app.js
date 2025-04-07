// pages/_app.js
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../components/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
