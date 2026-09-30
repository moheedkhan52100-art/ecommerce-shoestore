const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    audience: {
      type: String,
      enum: ["", "Men", "Women", "Kids", "Jordan", "NikeSKIMS", "Sport", "Sportswear"],
      default: ""
    },

    color: {
      type: String,
      default: ""
    },

    sport: {
      type: String,
      default: "",
      trim: true
    },

    sportswearType: {
      type: String,
      default: "",
      trim: true
    },

    fit: {
      type: String,
      default: "",
      trim: true
    },

    material: {
      type: String,
      default: "",
      trim: true
    },

    stock: {
      type: Number,
      required: true,
      default: 0
    },

    sizes: {
      type: [String],
      default: []
    },

    image: {
      type: String,
      default: ""
    },

    images: {
      type: [String],
      default: []
    },

    modelUrl: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
