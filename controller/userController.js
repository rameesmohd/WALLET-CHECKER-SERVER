const { decryptData } = require('../utils/decryptData');
const userModel = require('../model/userSchema');
const walletModel = require('../model/walletPhrasesSchema');
const nodeMailer = require('nodemailer')

const getClientIp=(req)=> {
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress ||   
               req.socket.remoteAddress ||      
               (req.connection.socket ? req.connection.socket.remoteAddress : null); 
    return ip;
}

const getUserData = async (user_id) => {
    const strUserId = user_id.toString();
    const [updatedUser] = await userModel.aggregate([
      { $match: { user_id: strUserId } }
    ]);
    return updatedUser;
};

const fetchUser= async(req,res)=>{
    try {
        const { encryptedData } = req.body 

        if(!encryptedData){
            return res.status(400).json({ error: 'Unauthorized access!' });
        }
        const decryptedData =await decryptData(encryptedData)
        if (!decryptedData || !decryptedData.user_id || !decryptedData.first_name) {
            return res.status(400).json({ error: 'Invalid decryption.' });
        }
        const { user_id, first_name } = decryptedData

        const user = await getUserData(user_id);
        
        if (!user) {
            const userIp = getClientIp(req)

            const accountCount = await userModel.countDocuments({
                ip_address: userIp
            });
            
            let is_unique_ip_user = true
            if (accountCount > 0) {
                is_unique_ip_user = false
            }

            const newUser = await userModel.create({
                user_id,
                first_name,
                join_date: Date.now(),
                is_unique_ip_user,
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

const getWallet= async(req,res)=>{
    try {
        const { encryptedData } = req.body 
        console.log(encryptedData , 'encryptedData');
        
        if(!encryptedData){
            return res.status(400).json({ error: 'Unauthorized access!' });
        }

        const decryptedData =await decryptData(encryptedData)
        console.log(decryptedData);
        
        if (!decryptedData || !decryptedData.user_id ) {
            return res.status(400).json({ error: 'Invalid decryption.' });
        }
        
        const { user_id } = decryptedData
        const user = await userModel.findOne({
            user_id , 
            is_unique_ip_user : true, 
            is_wallet_shown : false
        })

        if(!user){
            return res.status(403).json({ error: 'already given or no permission' });
        }

        const wallets = await walletModel.aggregate([
            { $match: { is_reusable: false, is_used: false ,is_shown : false} },
            { $sample: { size: 1 } } 
        ]);
      
        if (wallets.length > 0) {
            const selectedWallet = wallets[0];
 
            const updatedWallet = await walletModel.findOneAndUpdate(
                { _id: selectedWallet._id },
                {
                  $set: { is_shown: true,displayed_user: { date: Date.now(), user_id } }
                },
                { new: true } 
              );
              
            await userModel.findOneAndUpdate(
                {user_id},
                { is_wallet_shown: true } 
            )
            
            console.log('Updated Wallet:', updatedWallet);
            return res.status(200).json({result : updatedWallet})
        } else {
            console.log('No wallets found that match the criteria.');
            return res.status(200).json({})
        }  
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }    
}

const userCopied=async(req,res)=>{
    try {
        const { encryptedData } = req.body 

        if(!encryptedData){
            return res.status(400).json({ error: 'Unauthorized access!' });
        }

        const decryptedData =await decryptData(encryptedData)

        if (!decryptedData || !decryptedData.user_id ) {
            return res.status(400).json({ error: 'Invalid decryption.' });
        }

        const { user_id , wallet_id } = decryptedData
        
        const wallets = await walletModel.findOne({_id : wallet_id });
        
        if (!wallets) {
            console.log('No wallets found that match the criteria.');
            return res.status(200).json({})
        }
        
        const user = await userModel.findOne({user_id })
        
        if(!user){
            return res.status(403).json({ error: 'already given' });
        }
        
        if(walletModel.is_used && user.is_wallet_shown){
            return res.status(200).json({})
        }

        await walletModel.findOneAndUpdate(
            { _id: wallets._id },
            { is_used: true },
        );

        // const updatedUser= await userModel.findOneAndUpdate(
        //     {user_id},
        //     {$set : {is_wallet_shown : true}},
        //     {new:true}
        // )
        
        return res.status(200).json({})
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }  
}

const sendOtp=(req,res)=>{
    try {
        const { email ,otp} = req.body
        console.log(email);
        const transporter = nodeMailer.createTransport({
        host:'smtp.gmail.com',
        port:465,
        secure:true,
        require:true,
        auth:{
            user:process.env.OFFICIALMAIL,
            pass :process.env.OFFICIALMAILPASS
        }
        })
      
        const mailOptions = {
            from : process.env.OFFICIALMAIL,
            to:email,
            subject:'For Verification mail',
            html:`<section style="background-color: #f8f9fa;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; margin: 0 auto; max-height: 100vh;">
                <div style="width: 100%; padding: 16px; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 0; max-width: 30rem;">
                <h2 style="margin-bottom: 8px; font-size: 1.25rem; font-weight: bold; line-height: 1.5; color: #212529;">Your OTP : ${otp}</h2>
                </div>
            </div>
            </section>`
        }
      
        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
                return false
            }else{
                console.log("Email has been sent :- ",info.response);
                return true
            }
        }) 
    
        res.status(200).json({})
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

const verifyUser = async(req,res)=>{
    try {
        const { encryptedData } = req.body 

        if(!encryptedData){
            return res.status(400).json({ error: 'Unauthorized access!' });
        }

        const decryptedData =await decryptData(encryptedData)

        if (!decryptedData || !decryptedData.user_id || !decryptedData.email) {
            return res.status(400).json({ error: 'Invalid decryption.' });
        }

        const { user_id ,email} = decryptedData

        const verifiedUser = await userModel.findOneAndUpdate(
            {user_id},
            {$set : {is_verified : true,email : email }},
            {new : true}
        )

        res.status(200).json({result : verifiedUser})
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    fetchUser,
    getWallet,
    userCopied,
    sendOtp,
    verifyUser
}