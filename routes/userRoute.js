const express = require('express')
const router = express.Router();
const userController= require('../controller/userController')

router.post('/user',userController.fetchUser)
router.route('/wallet')
    .put(userController.getWallet)
    .patch(userController.userCopied)
router.post('/send-otp',userController.sendOtp)
router.post('/verify-user',userController.verifyUser)
module.exports= router