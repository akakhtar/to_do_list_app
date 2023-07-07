//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { Schema, model } = mongoose;

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://akakhtarsbg:4409atif@cluster0.szmlwck.mongodb.net/todolistDB?retryWrites=true&w=majority"
);

const itemsSchema = new Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to toDo list",
});

const item2 = new Item({
  name: "Click '+' to add an item",
});

const item3 = new Item({
  name: "<-- click here to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  async function getItems() {
    const Items = await Item.find({}).then(function (x) {
      if (x.length === 0) {
        Item.insertMany(defaultItems);
        console.log("Successfully saved the default items");
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: x });
      }
    });
  }
  getItems();
});

app.get("/:customListName", function (req, res) {
  const customListName =_.capitalize(req.params.customListName);
   
  async function findRoute() {
    const result = await List.findOne({ name: customListName }).then(function (
      x
    ) {
      if (!x) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", { listTitle: x.name, newListItems: x.items });
      }
    });
  }

  findRoute();
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (x) {
      x.items.push(item);
      x.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    async function deleteItem() {
      await Item.deleteOne({ _id: checkedItemId });
    }
    deleteItem();
    res.redirect("/");
  } else {
    async function findAndUpdate() {
     await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } });
    }    
    findAndUpdate();
      res.redirect("/" + listName);
    
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
