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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
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
  const [thumbnailType, setThumbnailType] = useState("image"); // "image" or "youtube"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bedrooms, setBedrooms] = useState([{ beds: "", type: "" }]);
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [error, setError] = useState("");

  /**
   * Convert YouTube URL to embedded format
   */
  const convertToEmbedUrl = (url) => {
    if (!url) return "";

    // Already an embed URL
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    // Extract video ID from various YouTube URL formats
    let videoId = "";

    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    }
    // Format: https://youtu.be/VIDEO_ID
    else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

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
        // Convert YouTube URL to embedded format
        thumbnailData = convertToEmbedUrl(youtubeUrl);
      } else if (thumbnail) {
        thumbnailData = thumbnail;
      } else {
        // Default placeholder image
        thumbnailData =
          "https://placehold.co/300x300?text=No+Image&font=roboto";
      }

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

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button onClick={() => navigate("/hosted-listings")} sx={{ mb: 2 }}>
          ← Back to Hosted Listings
        </Button>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create New Listing
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Title */}
              <TextField
                required
                fullWidth
                label="Listing Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cozy Beach House"
              />

              {/* Address */}
              <Typography variant="h6">Address</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </Grid>
              </Grid>

              {/* Price */}
              <TextField
                required
                fullWidth
                type="number"
                label="Price per Night"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />

              {/* Thumbnail */}
              <FormControl component="fieldset">
                <FormLabel component="legend">Thumbnail Type</FormLabel>
                <RadioGroup
                  row
                  value={thumbnailType}
                  onChange={(e) => setThumbnailType(e.target.value)}
                >
                  <FormControlLabel
                    value="image"
                    control={<Radio />}
                    label="Image"
                  />
                  <FormControlLabel
                    value="youtube"
                    control={<Radio />}
                    label="YouTube Video"
                  />
                </RadioGroup>
              </FormControl>

              {thumbnailType === "image" ? (
                <TextField
                  fullWidth
                  label="Thumbnail (Base64 or URL)"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="Leave empty for default image"
                  helperText="Provide a base64 encoded image or image URL"
                />
              ) : (
                <TextField
                  fullWidth
                  label="YouTube Video URL"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                  helperText="Paste any YouTube video URL (will be converted to embedded format)"
                />
              )}

              {/* Property Type */}
              <TextField
                required
                fullWidth
                label="Property Type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                placeholder="e.g., House, Apartment, Villa"
              />

              {/* Bathrooms */}
              <TextField
                fullWidth
                type="number"
                label="Number of Bathrooms"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />

              {/* Bedrooms */}
              <Typography variant="h6">Bedrooms</Typography>
              {bedrooms.map((bedroom, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", gap: 2, alignItems: "center" }}
                >
                  <TextField
                    type="number"
                    label="Number of Beds"
                    value={bedroom.beds}
                    onChange={(e) =>
                      handleBedroomChange(index, "beds", e.target.value)
                    }
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Bed Type"
                    value={bedroom.type}
                    onChange={(e) =>
                      handleBedroomChange(index, "type", e.target.value)
                    }
                    placeholder="e.g., Queen, King, Single"
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    onClick={() => handleRemoveBedroom(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddBedroom}
                variant="outlined"
              >
                Add Bedroom
              </Button>

              {/* Amenities */}
              <Typography variant="h6">Amenities</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Add Amenity"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddAmenity())
                  }
                  placeholder="e.g., WiFi, Pool, Parking"
                />
                <Button onClick={handleAddAmenity} variant="outlined">
                  Add
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {amenities.map((amenity, index) => (
                  <Chip
                    key={index}
                    label={amenity}
                    onDelete={() => handleRemoveAmenity(index)}
                  />
                ))}
              </Box>
              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ mt: 3 }}
              >
                Create Listing
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateListing;
