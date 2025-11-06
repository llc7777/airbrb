import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import HostedListings from "./pages/HostedListings";
import CreateListing from "./pages/CreateListing";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/hosted-listings" element={<HostedListings />} />
      <Route path="/listings/new" element={<CreateListing />} />
    </Routes>
  );
};

export default App;
