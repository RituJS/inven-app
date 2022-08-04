const Item = require("../models/item");
const Category = require("../models/category");
const async = require("async");
const { body, validationResult } = require("express-validator");

exports.item_list = function (req, res, next) {
  Item.find({})
    .populate("category")
    .exec(function (err, result) {
      if (err) {
        return next(err);
      }

      res.render("all-items", { title: "All Items", error: err, data: result });
    });
};

exports.item_detail = function (req, res, next) {
  const itemId = req.params.id;
  Item.findById(itemId)
    .populate("category")
    .exec(function (err, result) {
      if (err) {
        return next(err);
      }

      res.render("item-detail", {
        itemName: result.name,
        error: err,
        data: result,
      });
    });
};

exports.item_create_get = function (req, res, next) {

  Category.find({})
    .select("name")
    .exec(function (err, result) {
      if (err) {
        return next(err);
      }

      res.render("item-create", {
        updated: false,
        formAction: req.url,
        title: "Add Item",
        categories: result,
        errors: undefined,
        data: undefined,
      });
    });
};

exports.item_create_post = [

  body("itemName", "Item name must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("itemDescr", "Item Description must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("itemCategory").escape(),

  body("itemPrice", "Item price must be specified").escape(),

  body("numberInStock", "Item number of stock must be specified").escape(),


  function (req, res, next) {
    const errors = validationResult(req);

    const newItem = new Item({
      name: req.body["itemName"],
      description: req.body["itemDescr"],
      category: req.body["itemCategory"],
      price: Number(req.body["itemPrice"]),
      number_in_stock: Number(req.body["numberInStock"]),
    });

    if (!errors.isEmpty()) {      
      Category.find({})
        .select("name")
        .exec(function (err, result) {
          if (err) {
            return next(err);
          }

          res.render("item-create", {
            updated: false,
            formAction: req.url,
            title: "Add Item",
            categories: result,
            errors: errors.array(),
            data: undefined,
          });
        });
      return;
    } else {
    
      newItem.save(function (err) {
        if (err) {
          return next(err);
        }

        res.redirect(newItem.url);
      });
    }
  },
];

exports.item_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED");
};

exports.item_delete_post = function (req, res, next) {
  const itemId = req.params.id;
  Item.deleteOne({ _id: itemId }).exec(function (err) {
    if (err) {
      return next(err);
    }

    res.redirect("/catalog/items");
  });
};

exports.item_update_get = function (req, res, next) {
  const itemId = req.params.id;


  async.parallel(
    {
      categories: function (callback) {
        Category.find({}).exec(callback);
      },
      item: function (callback) {
        Item.findOne({ _id: itemId }).populate("category").exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }

      if (result.item === null) {
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }

      res.render("item-create", {
        updated: true,
        formAction: req.url,
        title: "Update Item",
        errors: undefined,
        data: result.item,
        categories: result.categories,
      });
    }
  );
};

exports.item_update_post = [
 
  body("itemName", "Item name must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("itemDescr", "Item Description must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  body("itemCategory").escape(),

  body("itemPrice", "Item price must be specified"),

  body("numberInStock", "Item number of stock must specified"),

  
  function (req, res, next) {
    const itemId = req.params.id;

    const errors = validationResult(req);

    const updatedItem = new Item({
      name: req.body["itemName"],
      description: req.body["itemDescr"],
      category: req.body["itemCategory"],
      price: Number(req.body["itemPrice"]),
      number_in_stock: Number(req.body["numberInStock"]),
      _id: req.params.id, 
    });

    if (!errors.isEmpty()) {
          async.parallel(
        {
          categories: function (callback) {
            Category.find({}).exec(callback);
          },
          item: function (callback) {
            Item.findOne({ _id: itemId }).populate("category").exec(callback);
          },
        },
        function (err, result) {
          if (err) {
            return next(err);
          }

          if (result.item === null) {
            const err = new Error("Item not found");
            err.status = 404;
            return next(err);
          }

          res.render("item-create", {
            updated: true,
            formAction: req.url,
            title: "Update Item",
            errors: errors.array(),
            data: result.item,
            categories: result.categories,
          });
        }
      );

      return;
    } else {
      Item.findByIdAndUpdate(itemId, updatedItem, {}).exec(function (
        err,
        theItem
      ) {

        if (err) {
          return next(err);
        }

        res.redirect(theItem.url);
      });
    }
  },
];
