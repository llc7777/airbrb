import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import HostedListings from "./pages/HostedListings";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import ViewListing from "./pages/ViewListing";
import ManageBookings from "./pages/ManageBookings";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/hosted-listings" element={<HostedListings />} />
      <Route path="/listings/new" element={<CreateListing />} />
      <Route path="/listings/:listingId" element={<ViewListing />} />
      <Route path="/listings/:listingId/edit" element={<EditListing />} />
      <Route
        path="/listings/:listingId/bookings"
        element={<ManageBookings />}
      />
    </Routes>
  );
};

export default App;
