const express = require('express')
const router = express.Router();
const adminController= require('../controller/adminController')
const { verifyToken } = require('../middleware/adminAuth')

router.post('/login',adminController.login)

router.use(verifyToken)
router.get('/users',adminController.fetchUsers)
router.get('/total-users',adminController.fetchTotalUsersCount)
router.route('/wallet')
    .get(adminController.fetchWallets)
    .post(adminController.addWallet)
    .delete(adminController.deleteWallet)

module.exports= router