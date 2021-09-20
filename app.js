const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");            // home, HOMe & Home is same list after using lodash

app.set("view engine", "ejs");          //view engine by default will look for the files to render

app.use(express.urlencoded({extended:true}) );
app.use(express.static("public"));                                 //serve up public folder as static resource

// mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false});
mongoose.connect(process.env.MONGODB_SERVER,{useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false});

const todolistSchema = {name: String};  // for all items in every list.
const listSchema = { name: {type:String, unique: true}, listitem: [todolistSchema] }; // for all lists

//mongoose model
const Item = mongoose.model("Item",todolistSchema);

const List = mongoose.model("List",listSchema);

const breakfast = new Item({name: "Breakfast"});
const study = new Item({name: "Study"});
const lunch = new Item({name: "Lunch"});

const array = [breakfast, study, lunch];

app.get("/", function(req, res) {
  Item.find({},function(err,results){           //{}= find all

    if(results.length === 0){
        Item.insertMany(array, function(err){
          if(err){
            console.log(err);
          }else{
            console.log("Successfully entered the details.");
          }
    });
    res.redirect("/");
    }else{
      res.render("list", {listTitle:"Today", newListItems: results});
    }
  });
});

// add a new item in an exixting list
app.post("/", function(req, res){
   const newlistitem = req.body.newItem;
   const listname = req.body.list;
   const newitem = new Item ({name: newlistitem});

    if(listname === "Today"){
      newitem.save();
      res.redirect("/");
    }else{
      List.findOne({name: listname},function(err,foundlist){
        foundlist.listitem.push(newitem);
        foundlist.save();
        res.redirect("/newlist/"+ listname);
      });
    }
});

// delete an existing item from their respective list
app.post("/delete",function(req,res){
  const checkboxid = req.body.checkbox;
  const listname = req.body.listname;

  if(listname === "Today"){
    Item.findByIdAndRemove(req.body.checkbox,function(err){
      if(!err){
        console.log("Item deleted successfully.");
        res.redirect("/");
      }
    });
  }else{//new route pe jaake delete karne se delete nhi ho rha tha & default page pe le jaa rha tha
    List.findOneAndUpdate({name: listname},{$pull:{listitem:{_id: checkboxid}}},function(err,foundlist){
      if(!err){
        console.log("Item deleted successfully.");
        res.redirect("/newlist/" + listname);
      }
    });
    }
});

/******************* Creating new custom list button */
app.post("/createlist",function(req,res){
  const newlisttitle = _.capitalize(req.body.newlisttitle);
  List.findOne({name: newlisttitle},function(err,findlist){
    if(!err){
      if(!findlist){
        //create a new list
        const list = new List({
          name: newlisttitle,
          listitem: array
        });
          list.save();
          res.redirect("/newlist/"+ newlisttitle);
      }else{
        //show an existing List
        res.render("list",{listTitle:findlist.name, newListItems: findlist.listitem});
      }
    }
  });
});
// adding new lists dynamically
app.get("/newlist/:parameter", function(req,res){
  // console.log(req.params);
  const path = _.capitalize(req.params.parameter);

  List.findOne({name: path},function(err,findlist){
    if(!err){
      if(!findlist){
        const list = new List({
          name: path,
          listitem: array
        });
          list.save();
          res.redirect("/newlist/"+ path);
      }else{
        res.render("list",{listTitle:findlist.name, newListItems: findlist.listitem});
        //if i add task to kunal's route then it adds to default home route, so i rectify it using above code
        // const list = new List({ name: customListName, items: defaultItems });
        // list.save();
      }
    }
  });

});

// listning to port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
