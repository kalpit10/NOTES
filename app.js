require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");  //we use const everywhere because we are using esversion:6
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.use(express.static('public'));//for css files we created public folder and used this for applying css..
app.set('view engine', 'ejs'); //creating a view engine to use ejs as a template engine
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({    //check documentation
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());  //we tell our app to initialize passport package
app.use(passport.session());   //and to also use passport for dealing with the sessions

// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true}); //useNewUrlParser is written to skip errors that mongodb shows
mongoose.connect("mongodb+srv://kalpit07:Nvidiagtx1650@cluster0.vnk2x.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true});


//FOR USING BUTTONS FOR GOOGLE, FACEBOOK ETC WHEN LOGIN GO TO SOCIALBUTTONS FOR BOOTSTRAP AND DOWNLOAD THAT ZIP FILE AND DRAG THE FILE OF BOOTSTRAP SOCAIL.CSS IN THE CSS FOLDER.


const userSchema = new mongoose.Schema({  //new definition because of mongoose encryption
  email: String,
  password: String,
  googleID: {
    type: String,
      require: true,
      index:true,
      unique:true,
      sparse:true
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({  //documentation for passportjs oauth20
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://stormy-depths-00269.herokuapp.com/auth/google/list"   //redirected url link that we created in credentials
  },
  function(accessToken, refreshToken, profile, cb){  //accessToken allows to get data related to that user,refreshToken allows to use the data for a longer period of time and their profile
          console.log(profile);
          //install and require find or create to make following function work
          User.findOrCreate({    //we first find the google id of that profile if it is there then bingo! if not then create one.
              googleId: profile.id,
              username: profile.displayName //changes here from udemy doubts section
          }, function(err, user){
              return cb(err, user);  //findOrCreate is a made up function made by passportjs and we will not be able to find the documentation for the same. there is a npm package so that this function works we need to install it.
          });
      }
  ));



const notesSchema = {
  name: String
};

const Item = mongoose.model("Item", notesSchema); //Item is written with capital and singlar, the one Item written after model will be shown as small letter and plural in database



const item1 = new Item({
  name: "Welcome to NOTES!!"
});

const item2 = new Item({
  name: "Hit + to Add a New Item"
});

const item3 = new Item({
  name: "Hit this to delete the item"
});

const defaultItems = [item1, item2, item3]; //3 items

const listSchema = {
  name: String,
  items: [notesSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
  res.render("home");
});


app.get("/list", function(req, res){

Item.find({}, function(err, foundItems) {

if(foundItems.length === 0){  //if we have 0 items then we insert 3 new items in there..
  Item.insertMany(defaultItems, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Success");
    }
  });
  res.redirect("/list");
}else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});  //find us everthing that is in our items collection
}

});                                                                                    //try date.getDate()/getDay() also so that it can show us the full date/Day

});

//type of authentication is GoogleStrategy and scope tells us that we want user's profile
app.route("/auth/google")
  .get(passport.authenticate('google', { scope: ['profile']
  }));


app.get("/auth/google/list",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/list");
  });

app.get("/login", function(req, res){
  res.render("login");
});


app.get("/register", function(req, res){
  res.render("register");
});



app.get("/:customListName", function(req, res){  //if we want any list for user for eg. if he wants to work on localhost:3000/home he can just search that and start working on it.
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){ //if there is a err then show err if there is no err then show the founded list
    if(!err){
      if(!foundList){
      //Create a new List
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/list" + customListName);  //when we will laod to a custom page it will redirect to customListName page only.
      }else{
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});



app.post("/list", function(req, res){

  const itemName = req.body.newItem; //body means bodyParser
  const listName = req.body.list;

  const item = new Item({  //item document created
    name: itemName
  });

  if(listName === "Today"){ //if user wants to save element in default list then just res.redirect to default
    item.save();
    res.redirect("/list");
}else{                                   //if a user came from a custom list then we are going to add the new item to that list and then redirect that page
  List.findOne({name: listName}, function(err, foundList){    //foundList is singular here cause findOne
    foundList.items.push(item);
    foundList.save();
    res.redirect("/list" + listName);
  });
}
});


app.post("/delete", function(req, res){  //this will work when the checkbox is ticked for deleting an item
const checkedItemId = req.body.checkbox;
const listName = req.body.listName;

if(listName === "Today"){
  Item.findByIdAndRemove(checkedItemId, function(err){   //findByIdAndRemove() is a method that deletes the item of a particular id when checked
    if(!err){
      console.log("Succesfully deleted checked item");
      res.redirect("/list");
    }
  });
}else{
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/list" + listName);
    }
  });
}

});



app.get("/work", function(req, res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});


app.get("about", function(req, res){
  res.render("about");
});


app.post("/work", function(req, res){
  const item=req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});


app.get("/logout", function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
});

app.post("/register", function(req, res){

User.register({username: req.body.username}, req.body.password, function(err, user){
  if(err){
    console.log(err);
    res.redirect("/");
  }else{
    passport.authenticate("local")(req, res, function(){ //type of authentication is local and callback function is triggerred when authentication is a success
      res.redirect("/list");
    });
  }
}); //register method comes with passportLocalMongoose package.

});

app.post("/login", function(req, res){

const user = new User({
  username: req.body.username,
  password: req.body.password
});

req.login(user, function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req, res, function(){  //if we login successfully we are going to send the cookie and tell our browser to hold on to that cookie, cookie tells that user is authorized
      res.redirect("/list");
    });
  }
});

});


let port = process.env.PORT; //heroku steps
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started succesfully");
});
