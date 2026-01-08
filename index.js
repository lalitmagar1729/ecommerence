var express = require("express");
var bodyparser = require("body-parser");
var fileUpload = require("express-fileupload");
var session = require("express-session");
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
var url = require("url");

var app = express();

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(fileUpload());
app.use(session({
    secret: "ABCDE12345",
    resave: true,
    saveUninitialized: true
}));
app.use(express.static("public/"));
app.use(function(req, res, next){
    var url_data = url.parse(req.url, true).query;
    req.url_data = url_data;
    next();
})

app.use("/", userRouter);
app.use("/admin", adminRouter);

app.listen(1000);