const express = require("express");
const router = express.Router({ mergeParams: true }); // Important for nested routes
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../Schema.js");
const Listing = require("../model/listing.js");
const Review = require("../model/review.js");
const { isLogin } = require("../midlewareLogin.js");

let validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.details.map(el => el.message).join(","));
    } else {
        next();
    }
};

let isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId); // Fixed: Use Review model
    if (!review.author.equals(res.locals.currUser._id)) { // Fixed: Correct comparison syntax
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Route to add a review to a specific listing
router.post("/", isLogin, validateReview, wrapAsync(async (req, res) => {
    console.log("Received ID from URL:", req.params.id);  // Should log the ID

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    const newReview = new Review(req.body.reviews);
    newReview.author = req.user._id;   // Set author
    await newReview.save();
    listing.reviews.push(newReview._id);
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
}));

// Route to delete a specific review from a listing
router.delete("/:reviewId", isLogin, isReviewAuthor, wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));

module.exports = router;
