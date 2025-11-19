import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Rating,
  Typography,
} from "@mui/material";

/**
 * ReviewDialog Component
 * Dialog for leaving a review for a listing
 */
const ReviewDialog = ({ open, onClose, onSubmit, listingTitle }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      return;
    }
    onSubmit(rating, comment);
    handleClose();
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Leave a Review for {listingTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Rating *
            </Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
              size="large"
            />
          </Box>
          <TextField
            label="Comment (optional)"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={rating === 0}
        >
          Submit Review
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewDialog;
