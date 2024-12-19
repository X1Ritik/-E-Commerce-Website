if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js");

const ListingsRoutes = require("./Routes/listing.js");
const ReviewRoutes = require("./Routes/reviews.js");
const UserRoutes = require("./Routes/user.js");
const winston = require('winston');
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const dburl = process.env.ATLAST || 'mongodb://127.0.0.1:27017/wanderLust';

// Views configuration
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// MongoDB connectionconst winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// ...

// MongoDB connection
async function main() {
  try {
   await mongoose.connect(dburl);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}
main();

// ...

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  logger.error(`Error ${statusCode}: ${message}`);
  res.status(statusCode).render("error.ejs", { message });
});

// ...

// Catch-all for 404 errors
app.all("*", (req, res, next) => {
  logger.info('404 error');
  next(new ExpressError(404, "Page not found!"));
});

async function main() {
    try {
        await mongoose.connect(dburl, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
}
main();

const store = MongoStore.create({
    mongoUrl: dburl,
    crypto: {
        secret: process.env.SECRET_KEY ,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("Session error occurred:", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET_KEY ,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash and Locals Middleware
app.use((req, res, next) => {
    console.log("Current User:", req.user);
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    next();
});

// Routes
app.use("/listings", ListingsRoutes);
app.use("/listings/:id/reviews", ReviewRoutes);
app.use("/", UserRoutes);

app.get('/', (req, res) => {
    res.send("Server is working well");
});

// Catch-all for 404 errors
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
