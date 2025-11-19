import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Rating,
  Divider,
} from "@mui/material";

/**
 * RatingFilterDialog Component
 * Shows rating breakdown or filtered reviews by specific rating
 */
const RatingFilterDialog = ({
  open,
  onClose,
  selectedRating,
  onSelectRating,
  reviews,
}) => {
  /**
   * Calculate rating breakdown (count and percentage for each star rating)
   */
  const calculateRatingBreakdown = (reviewList) => {
    if (!reviewList || reviewList.length === 0) {
      return [0, 0, 0, 0, 0];
    }

    const breakdown = [0, 0, 0, 0, 0]; // Index 0 = 5 stars, Index 4 = 1 star
    reviewList.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        breakdown[5 - review.rating]++;
      }
    });

    return breakdown;
  };

  /**
   * Get reviews filtered by rating
   */
  const getReviewsByRating = (rating) => {
    if (!reviews) return [];
    return reviews.filter((review) => review.rating === rating);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedRating
          ? `${selectedRating} Star Reviews (${
              getReviewsByRating(selectedRating).length
            })`
          : "Rating Breakdown"}
      </DialogTitle>
      <DialogContent>
        {selectedRating ? (
          // Show reviews for specific rating
          getReviewsByRating(selectedRating).length > 0 ? (
            getReviewsByRating(selectedRating).map((review, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Rating value={review.rating} size="small" readOnly />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    by {review.owner}
                  </Typography>
                </Box>
                {review.comment && (
                  <Typography variant="body2">{review.comment}</Typography>
                )}
                {index < getReviewsByRating(selectedRating).length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No reviews for this rating
            </Typography>
          )
        ) : (
          // Show rating breakdown with clickable bars
          <Box sx={{ py: 2 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const breakdown = calculateRatingBreakdown(reviews || []);
              const count = breakdown[5 - star];
              const percentage =
                reviews?.length > 0
                  ? ((count / reviews.length) * 100).toFixed(1)
                  : 0;

              return (
                <Box
                  key={star}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1.5,
                    cursor: count > 0 ? "pointer" : "default",
                    "&:hover": {
                      backgroundColor:
                        count > 0 ? "rgba(0, 0, 0, 0.04)" : "transparent",
                    },
                    p: 1.5,
                    borderRadius: 1,
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => {
                    if (count > 0) {
                      onSelectRating(star);
                    }
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      minWidth: 70,
                      display: "flex",
                      alignItems: "center",
                      fontWeight: 500,
                    }}
                  >
                    {star} ★
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 12,
                      backgroundColor: "rgba(0, 0, 0, 0.1)",
                      borderRadius: 1,
                      overflow: "hidden",
                      mx: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: "#faaf00",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ minWidth: 100, fontWeight: 500 }}
                  >
                    {percentage}% ({count})
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {selectedRating && (
          <Button onClick={() => onSelectRating(null)}>Back</Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingFilterDialog;
