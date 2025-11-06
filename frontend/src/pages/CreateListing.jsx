import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
  Grid,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { listingsAPI } from "../utils/api";

/**
 * CreateListing Component
 * Form to create a new listing
 */
const CreateListing = () => {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bedrooms, setBedrooms] = useState([{ beds: "", type: "" }]);
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [error, setError] = useState("");

  /**
   * Add a new bedroom field
   */
  const handleAddBedroom = () => {
    setBedrooms([...bedrooms, { beds: "", type: "" }]);
  };

  /**
   * Remove a bedroom field
   */
  const handleRemoveBedroom = (index) => {
    setBedrooms(bedrooms.filter((_, i) => i !== index));
  };

  /**
   * Update bedroom data
   */
  const handleBedroomChange = (index, field, value) => {
    const updated = [...bedrooms];
    updated[index][field] = value;
    setBedrooms(updated);
  };

  /**
   * Add amenity
   */
  const handleAddAmenity = () => {
    if (newAmenity.trim()) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  /**
   * Remove amenity
   */
  const handleRemoveAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!title || !price || !propertyType) {
      setError(
        "Please fill in all required fields (Title, Price, Property Type)"
      );
      return;
    }

    // Calculate total beds
    const totalBeds = bedrooms.reduce((sum, bedroom) => {
      return sum + (parseInt(bedroom.beds) || 0);
    }, 0);

    try {
      // Prepare address object
      const address = {
        street: street || "",
        city: city || "",
        state: state || "",
        postcode: postcode || "",
        country: country || "",
      };

      // Prepare metadata
      const metadata = {
        propertyType,
        bathrooms: parseInt(bathrooms) || 0,
        beds: totalBeds,
        bedrooms: bedrooms.filter((b) => b.beds && b.type),
        amenities,
      };

      // Use default thumbnail if not provided
      const thumbnailData =
        thumbnail || "https://via.placeholder.com/400x300?text=No+Image";
      // Create listing
      await listingsAPI.createListing(
        title,
        address,
        parseFloat(price),
        thumbnailData,
        metadata
      );

      // Navigate back to hosted listings
      navigate("/hosted-listings");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to create listing. Please try again."
      );
    }
  };
};

export default CreateListing;
