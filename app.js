const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js") //we added dirname because we didnt install date with npm so it will search for directory here..

const app = express();

const items = ["MOMOS", "CHILLY POTATO", "SPRING ROLLOS"];
const workItems = [];
const day = [];
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true})); //did for app.post newItem

app.use(express.static('public'));//for css files we created public folder and used this for applying css..

app.get("/", function(req, res){

const day = date.getDate(); //try date.getDate()/getDay() also so that it can show us the full date/Day

  res.render("list", {listTitle: day, newListItems: items});
});

app.post("/", function(req, res){

  const item = req.body.newItem;

  if(req.body.list === "Work List"){
    workItems.push(item);
    res.redirect("/work");
  }else{
    items.push(item);
    res.redirect("/");
  }
});

app.get("/work", function(req, res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});


app.post("/work", function(req, res){
  const item=req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
})

app.listen(3000, function(){
  console.log("Server started on port 3000");
});
