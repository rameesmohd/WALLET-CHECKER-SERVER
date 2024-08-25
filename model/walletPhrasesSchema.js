const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user_id :{
    type : String,
    unique: true,
    required : true,
  },
  join_date : {
    type: Date,
    required : true
  },
  is_reusable : {
    type: Boolean,
    required : true
  },
  is_active: {
    type: Boolean,
    default: false,
  },
  displayed_users :{
    type : [
        {
            date : {
                type: Date,
                required : true
            },
            user_id : {
                type : String,
                required : true
            }
        }
    ]
  }
});

userSchema.index({ userId: 1 });
userSchema.index({ join_date: -1 });
userSchema.index({ ip_address: 1 });

const walletModel = new mongoose.model("wallets", walletSchema);
module.exports = walletModel;