const express = require('express')
const router = express.Router();
const adminController= require('../controller/adminController')

router.post('/login',adminController.login)
router.get('/users',adminController.fetchUsers)
router.get('/total-users',adminController.fetchTotalUsersCount)
router.route('/wallet')
    .get(adminController.fetchWallets)
    .post(adminController.addWallet);

module.exports= router