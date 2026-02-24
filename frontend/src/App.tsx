import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { RootLayout } from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import GalleryPage from "./pages/GalleryPage";
import PricingPage from "./pages/PricingPage";
import TournamentPage from "./pages/TournamentPage";
import BookingPage from "./pages/BookingPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import WatchmanPanelPage from "./pages/WatchmanPanelPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import AuthPage from "./pages/AuthPage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import "react-datepicker/dist/react-datepicker.css";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/user/dashboard" element={<UserDashboardPage />} />
          <Route path="/watchman" element={<WatchmanPanelPage />} />
          <Route path="/admin" element={<AdminPanelPage />} />
          {/* We will add more routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
