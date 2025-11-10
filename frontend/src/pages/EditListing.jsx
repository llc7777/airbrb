import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { listingsAPI } from "../utils/api";

/**
 * EditListing Component
 * Form to edit an existing listing
 */
const EditListing = () => {
  const navigate = useNavigate();
  const { listingId } = useParams();

  // Form state
  const [title, setTitle] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailType, setThumbnailType] = useState("image"); // "image" or "youtube"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bedrooms, setBedrooms] = useState([{ beds: "", type: "" }]);
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [error, setError] = useState("");

  // Fetch listing data on mount
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await listingsAPI.getListingById(listingId);
        const listing = response.data.listing;

        // Populate form with existing data
        setTitle(listing.title || "");
        setPrice(listing.price?.toString() || "");

        // Parse address
        if (listing.address) {
          setStreet(listing.address.street || "");
          setCity(listing.address.city || "");
          setState(listing.address.state || "");
          setPostcode(listing.address.postcode || "");
          setCountry(listing.address.country || "");
        }

        // Check if thumbnail is YouTube embed
        if (listing.thumbnail?.includes("youtube.com/embed/")) {
          setThumbnailType("youtube");
          setYoutubeUrl(listing.thumbnail);
        } else {
          setThumbnailType("image");
          setThumbnail(listing.thumbnail || "");
        }

        // Parse metadata
        if (listing.metadata) {
          setPropertyType(listing.metadata.propertyType || "");
          setBathrooms(listing.metadata.bathrooms?.toString() || "");
          setAmenities(listing.metadata.amenities || []);

          // Parse bedrooms
          if (
            listing.metadata.bedrooms &&
            listing.metadata.bedrooms.length > 0
          ) {
            setBedrooms(listing.metadata.bedrooms);
          }
        }
      } catch (err) {
        setError("Failed to load listing data. Please try again.");
      }
    };

    fetchListing();
  }, [listingId]);

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

      // Determine thumbnail data based on type
      let thumbnailData;
      if (thumbnailType === "youtube" && youtubeUrl) {
        // Validate that the URL is an embedded YouTube URL
        if (!youtubeUrl.includes("youtube.com/embed/")) {
          setError(
            "Please provide an embedded YouTube URL. Example: https://www.youtube.com/embed/VIDEO_ID"
          );
          return;
        }
        thumbnailData = youtubeUrl;
      } else if (thumbnail) {
        thumbnailData = thumbnail;
      } else {
        // Default placeholder image
        thumbnailData =
          "https://placehold.co/300x300?text=No+Image&font=roboto";
      }

      // Update listing
      await listingsAPI.updateListing(
        listingId,
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
          "Failed to update listing. Please try again."
      );
    }
  };
};

export default EditListing;
