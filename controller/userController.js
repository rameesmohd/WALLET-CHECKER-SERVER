const { decryptData } = require('../utils/decryptData');
const userModel = require('../model/userSchema')

const getClientIp=(req)=> {
    const ip = req.headers['x-forwarded-for'] || // Standard header used by proxies
               req.connection.remoteAddress ||   // Remote address of the request
               req.socket.remoteAddress ||       // Fallback for newer versions of Node.js
               (req.connection.socket ? req.connection.socket.remoteAddress : null); // Fallback for older versions of Node.js
    return ip;
  }

const getUserData = async (user_id) => {
    const strUserId = user_id.toString();
    const [updatedUser] = await userModel.aggregate([
      { $match: { user_id: strUserId } },
      {
        $project: {
            my_wallet_checked : 0
        },
      },
    ]);
    return updatedUser;
};

const fetchUser= async(req,res)=>{
    try {
        const { encryptedData } = req.body 
        // console.log('req.body', req.body);

        if(!encryptedData){
            return res.status(400).json({ error: 'Unauthorized access!' });
        }
        const decryptedData =await decryptData(encryptedData)
        if (!decryptedData || !decryptedData.user_id || !decryptedData.first_name) {
            return res.status(400).json({ error: 'Invalid decryption.' });
        }
        const { user_id, username, first_name } = decryptedData

        const user = await getUserData(user_id);
        // console.log(user , 'user');
        
        console.log('decryptedData :',decryptedData );
        
        if (!user) {
            const userIp = getClientIp(req)

            const accountCount = await userModel.countDocuments({
                ip_address: userIp
            });
            
            let is_valid_user = true
            if (accountCount > 1) {
                is_valid_user = false
            }

            const newUser = await userModel.create({
                user_id:user_id,
                user_name: (username && username!='null') ? username : 'Unknown',
                first_name,
                join_date: Date.now(),
                is_valid_user: is_valid_user,
                ip_address : userIp
            });
            
            return res.status(201).json({data: newUser});
        } else {
            return res.status(200).json({ data: user });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }    
}

module.exports = {
    fetchUser
}