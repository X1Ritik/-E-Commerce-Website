const express = require("express");
const router = express.Router();
const User = require("../model/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");

router.get("/signup", (req, res) => {
    res.render("user/signup");
});

router.post("/signup", wrapAsync(async (req, res) => {
    let { username, email, password } = req.body;
    let presentUser = new User({ email, username });
    const regesterUser = await User.register(presentUser, password);
    req.flash("success","you are successfully sing-up in there ");
    res.redirect("/listings");
    }))

router.get("/login", (req, res) => {
    res.render("user/login");
});

router.post("/login", passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true     //not login asel tar / password or username galat asnar tar
}), (req, res) => {
    req.flash("success", "Welcome back to WanderLust..!");
    res.redirect("/listings");
});

//logout
router.get("/logout", (req,res,next)=>{
    req.logout((err)=>{
        if(err){
           return next();
        }
        req.flash("success", "You are successfully loged out");
        res.redirect("/listings");
    })
})

module.exports = router;