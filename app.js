const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true})); //did for app.post newItem
app.use(express.static('public'));//for css files we created public folder and used this for applying css..

mongoose.connect("mongodb+srv://kalpit07:Nvidiagtx1650@cluster0.vnk2x.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true});
//useNewUrlParser is used for not getting any errors

const notesSchema = {
  name: String
};

const Item = mongoose.model("Item", notesSchema); //Creating a model

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

Item.find({}, function(err, foundItems) {

if(foundItems.length === 0){  //if we have 0 items then we insert 3 new items in there..
  Item.insertMany(defaultItems, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Success");
    }
  });
  res.redirect("/");
}else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});  //find us everthing that is in our items collection
}

});                                                                                    //try date.getDate()/getDay() also so that it can show us the full date/Day

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
      res.redirect("/" + customListName);  //when we will laod to a custom page it will redirect to customListName page only.
      }else{
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({  //item document created
    name: itemName
  });

  if(listName === "Today"){ //if user wants to save element in default list then just res.redirect to default
    item.save();
    res.redirect("/");
}else{                                   //if a user came from a custom list then we are going to add the new item to that list and then redirect that page
  List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
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
      res.redirect("/");
    }
  });
}else{
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/" + listName);
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

let port = process.env.PORT; //heroku steps
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(err){    //new way of starting the server
    if (err) console.log("Error in server setup");
    console.log("Server listening on Port");
})
