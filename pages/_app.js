import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { PopupWindowsProvider } from '../context/PopupWindowsContext';
import PopupDock from '../components/popup/PopupDock';
import PopupAutoOpener from '../components/popup/PopupAutoOpener';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <PopupWindowsProvider>
          <Component {...pageProps} />
          <PopupAutoOpener />
          <PopupDock />
        </PopupWindowsProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default MyApp;
