import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

import 'leaflet/dist/leaflet.css';
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from './app/contexts/ThemeContext';
import { UserProvider } from './app/contexts/UserContext';
import { NotificationProvider } from './app/contexts/NotificationContext';
import { IssuesProvider } from './app/contexts/IssuesContext';

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <UserProvider>
        <NotificationProvider>
          <IssuesProvider>
            <App />
          </IssuesProvider>
        </NotificationProvider>
      </UserProvider>
    </ThemeProvider>
  </BrowserRouter>
);
