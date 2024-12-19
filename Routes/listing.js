const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js"); // Fixed typo: Changed 'ExpresError' to 'ExpressError'.
const { listingSchema } = require("../Schema.js"); // Removed unused 'reviewSchema' import.
const Listing = require("../model/listing.js");
const { isLogin } = require("../midlewareLogin.js");
const user = require("./user.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Middleware to validate listing data
let validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.details[0].message); // Properly handle validation errors.
    } else {
        next(); // Proceed if validation passes.
    }
}

// Route to get all listings
router.get("/", wrapAsync(async (req, res) => {
    const listingAll = await Listing.find({});
    res.render("Listings/index", { listingAll });
}));

// Route to show the form to create a new listing
router.get("/new", isLogin, (req, res) => {
    res.render("Listings/create");
})

//search
router.get('/search', isLogin, wrapAsync(async (req, res) => {
    const searchQuery = req.query.query;
    const searchResults = await Listing.find({ 
        title: { $regex: searchQuery, $options: "i" } // Use regex for case-insensitive matching
    });

    console.log("The search results:", searchResults);
    res.render('Listings/index', { listingAll: searchResults }); // Pass search results to the template
}));


// Route to add a new listing
router.post("/",
    isLogin,
    upload.single('data'),
    wrapAsync(async (req, res) => {
        const { title, description, price, location, country } = req.body;

        const listing = new Listing({
            title,
            description,
            price,
            location,
            country,
            owner: req.user._id,
        });

        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        await listing.save();

        req.flash('success', 'Listing is created...!');
        res.redirect("/listings");
    })
);

// Route to read a specific listing 
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner"); if (!listing) {
            throw new ExpressError(404, "Listing not found"); // Handle missing listing.
        }
    // console.log(listing);
    res.render("Listings/show", { listing }); // Render listing details.
}));

// Route to show the form to edit a specific listing
router.get("/:id/edit", isLogin, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    let original = listing.image.url;
    let ChangedImage = original.replace("/upload", "/upload/w_250");
    res.render("Listings/edit", { listing, ChangedImage });
}));

//buy
router.get("/:id/buy", isLogin, wrapAsync(async (req, res) => {

    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner"); if (!listing) {
            throw new ExpressError(404, "Listing not found"); // Handle missing listing.
        }
    const email =  listing.owner.email;
    console.log("mail",email);
    res.render("Listings/Mail", {email});
}));

// Base route for all listin

// Route to update a specific listing
router.put("/:id",
    isLogin,
    upload.single('data'),
    wrapAsync(async (req, res) => {
        let { id } = req.params;

        const updatedListing = await Listing.findByIdAndUpdate(id, req.body, { new: true });

        if (req.file) {
            const url = req.file.path;
            const filename = req.file.filename;
            updatedListing.image = { url, filename };
            await updatedListing.save();
        }
        res.redirect("/listings");
    }));


// Route to delete a specific listing
router.delete("/:id", isLogin, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const deleteList = await Listing.findByIdAndDelete(id); // Delete listing.
    if (!deleteList) {
        throw new ExpressError(404, "Listing not found"); // Handle missing listing.
    }
    res.redirect("/listings"); // Redirect to listings page.
}));

module.exports = router; // Export the router.
