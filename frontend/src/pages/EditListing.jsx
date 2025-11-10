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

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button onClick={() => navigate("/hosted-listings")} sx={{ mb: 2 }}>
          ← Back to Hosted Listings
        </Button>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Edit Listing
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
                  label="YouTube Embedded URL"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  helperText="Only embedded YouTube URLs are accepted (format: youtube.com/embed/VIDEO_ID)"
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
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EditListing;
