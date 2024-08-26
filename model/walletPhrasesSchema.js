const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  wallet_chain :{
    type : String,
    required : true,
    enum: ["Bitcoin", "Tron", "Ethereum", "Binance", "Ripple", "Solana"],
  },
  wallet_balance : {
    type: String,
    required : true
  },
  is_reusable : {
    type: Boolean,
    required : false
  },
  is_used: {
    type: Boolean,
    default: false,
  },
  wallet_phrase : {
    type: String,
    required : true
  },
  displayed_user:{
      date : {
          type: Date,
      },
      user_id : {
          type : String,
      }
  },
  created_date : {
    type : Date,
    required : true
  }
});

walletSchema.index({ wallet_chain: 1 });
walletSchema.index({ is_used: -1 });

const walletModel = new mongoose.model("wallets", walletSchema);
module.exports = walletModel;