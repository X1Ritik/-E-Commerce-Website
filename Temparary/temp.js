const express = require("express");
const app = express();
const session = require("express-session");

const sessionOptions= {
    secret: "mysupersecretstring",
    resave : false,
    saveInitialized : true,
}

app.use(session(sessionOptions));

app.get("/test", (req, res)=>{
    let name = req.query; //we are stroe the temp.. data
    req.session.name = name;
    res.send(`The name is stored ${req.session.name.name}`);
    console.log(req.session.name.name);
})

app.get("/marks",(req,res)=>{
    //take data from differant routes
    res.send(req.session.name.name);
})

app.listen(8080,()=>{
    console.log("Connection successfull");
})