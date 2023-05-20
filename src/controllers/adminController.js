const adminModel = require('../models/adminModel');
const EmployeeId=require("../models/employeeIdSchema")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const User=require("../models/userModel")
const cookie = require('cookie')
const Lead=require('../models/leadsModel')
/*----------------------------------------adminRegister api------------------------------------------*/
const isValidPwd = function (Password) {
    return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(Password)
}
const isEmail = function (email) {
    var emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (email !== '' && email.match(emailFormat)) { return true; }

    return false;
}

function isNumberstring(str) {
    if (typeof str != "string") return false // we only process strings!
    if (typeof str == "string") {
        if ((str.match(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/))) {
            return true
        }
        else {
            return false
        }
    }
    return false
}



const adminRegister = async (req, res) => {
    try {
        let adminInfo = req.body
        let { name, email, mobile, password } = adminInfo
if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, msg: "please enter a data in request body" })

        /*------------------------------Validation for name--------------------------------*/
        if (!name)
            return res.status(400).send({ status: false, msg: "Name is missing" })

        if (!isNaN(name)) return res.status(400).send({ status: false, msg: " Please enter Name as a String" });

        /*------------------------------Validation for Email--------------------------------*/
        if (typeof email !== "string") return res.status(400).send({ status: false, msg: " Please enter  email as a String" });
        if (!isEmail(email)) { return res.status(400).send({ status: false, msg: "Enter valid Email." }) }

        const emailUnique = await adminModel.findOne({ email: email })
        if (emailUnique) {
            return res.status(400).send({ status: false, msg: "eamil is alreday exist" })
        }

        /*------------------------------Validation for Mobile--------------------------------*/

        if (!mobile)
            return res.status(400).send({ status: false, msg: "mobile is missing" })

        if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(mobile)) {
            return res.status(400).send({ status: false, msg: " please enter Phone_number" })
        }
        /*------------------------------Validation for password--------------------------------*/

        if (!password)
            return res.status(400).send({ status: false, msg: "password is missing" })
        if (!(password.length > 6 && password.length < 16)) return res.status(400).send({ status: false, msg: "password should be greater than 6 and less then 16 " })
if (!isValidPwd(password)) { return res.status(400).send({ status: false, msg: "Enter valid password." }) }
        // //-----------[Password encryption]
        password = await bcrypt.hash(password, 10)
        const savedAdminInfo = await adminModel.create({
            name:name,
            email:email,
        mobile:mobile,
        password:password
        })
        res.status(200).send({ status: true, savedAdminInfo })
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


/*----------------------------------------adminLogin  api------------------------------------------*/

const adminLogin = async (req, res) => {
    try {

        let data = req.body
        let { email, password } = data

        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please Enter data" })

        /*------------------------------Validation for Email--------------------------------*/

        if (!email) return res.status(400).send({ status: false, message: 'Please enter email' })
        if (!isEmail(email)) { return res.status(400).send({ status: false, msg: "Enter valid Email." }) }

        if (typeof email !== "string") return res.status(400).send({ status: false, msg: " Please enter  email as a String" });


        if (!password) return res.status(400).send({ status: false, message: 'Please enter password' })

        const Login = await adminModel.findOne({ email })      /////store entire schema
        if (!Login) return res.status(400).send({ status: false, message: 'Not a register email Id' })

        let PassDecode = await adminModel.findOne({ password })
        if (!PassDecode) return res.status(400).send({ status: false, message: "Not a register Password" })

        //----------[JWT token generate]
        let token = jwt.sign({
            userId: Login._id.toString()       //to remove Object_id
        }, "admin panel", { expiresIn: '50d' })

        res.setHeader("x-api-key", token)
        res.cookie("Access_token", token)
        let tok = req.cookies.Access_token
        return res.status(200).send({ status: true, message: 'Admin login successfull', data: token })

    }
    catch (err) { return res.status(500).send({ status: false, msg: err.massage }) }
}



/*----------------------------------------adminreset api------------------------------------------*/
const adminreset = async (req, res) => {
    try {
        let { password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, msg: "please enter a data in request body" })
        if (!password) {
            return res.status(400).send({ status: false, msg: "new password is missing" })
        }
        if (!confirmPassword) {
            return res.status(400).send({ status: false, msg: "new password is missing" })
        }
        let token = req.cookies.Access_token
        let decodedToken = jwt.verify(token, "admin panel")
        let adminId = decodedToken.userId
        let updatepassword = await adminModel.findOneAndUpdate({ _id: adminId }, { password: password });
        res.status(200).send({ status: true, data: updatepassword });
    }
    catch (err) { return res.status(500).send({ status: false, msg: err.massage }) }
}

/*----------------------------------------adminforget api------------------------------------------*/




/*----------------------------------------admiemailsend  api------------------------------------------*/



const admiemailsend = async (req, res) => {
    let { email } = req.body
    let data = await adminModel.findOne({ email: email })
    res.cookie("email", req.body.email)
    if (!data) {
        return res.status(400).send({ status: false, msg: "Plz enter valid email ID" })
    }
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
             user: "pspkbabul@gmail.com",
            pass: "oibjumbrbeyjdqrc"
        }
    });
    let otpnum = Math.floor(1000 + (Math.random() * 9000))

    let addotp = await adminModel.findOneAndUpdate({ email: req.body.email }, { $set: { otp: otpnum } })
    var mailOptions = {
        from: "pspkbabul@gmail.com",
        to: req.body.email,
        subject: "Reset Password OTP",
        text: `
    hello reset password OTP for email  is ${otpnum}


    If you have any questions, please don't hesitate to contact me.

    Your faithfully, `
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            res.status(200).send(info)
        }
    });
}

/*------------------------------Task for 6 feb--------------------------------*/



/*----------------------------------------adminverfiypassword api------------------------------------------*/

const adminverfiypassword = async (req, res) => {
    if(!req.body.otp){
        return res.status(400).json({ status: false, message: "Please Put Your Otp" })

    }
    const varifyOtp = await adminModel.findOne({ "_id": decodedToken.userId})

    if (!varifyOtp) {
        res.status(400).json({ status: false, message: "User Not Found" })
    }
    try {
        if (varifyOtp.otp == req.body.otp) {
            res.status(200).json({ status: true, message: "Success" })
        } else {
            res.status(400).json({ status: false, message: "Put valid OTP" })

        }
    } catch (error) {
        res.json(error)
    }
}
/*----------------------------------------adminchangepassword api------------------------------------------*/



const adminchangepassword = async (req, res) => {
    let validAdmin=await adminModel.findOne({"_id":decodedToken.userId})
    try {

        if (!req.body.password) return res.status(400).send({ status: false, message: "Please Enter Your Password" })
        let { password } = req.body
 // Decode email from cookie
        
        if (!password)
            return res.status(400).send({ status: false, message: "Password Is Missing" })
            
        if (!(password.length > 6 && password.length < 16)) return res.status(400).send({ status: false, message: "Password Should (6-16)" })
        // const bcryptPassword = await bcrypt.hash(password, 10)
        if(validAdmin){
             password=bcrypt.hashSync(password, 10)
            let changepassword = await adminModel.updateOne({ _id: validAdmin._id },
                { $set: { password: password } }
    
            )
            res.status(200).send({ status: true, data: changepassword });
        }else{
    return res.status(500).send({ status: false, message: "Invalid Password" }) }

        
       
    }
    catch (err) { return res.status(500).send({ status: false, message: err.massage }) }
}


// generateEmployeeId
const generateEmployeeId = async (req, res) => {

    try {
        let employee = req.body.id
        if(!employee){
            return res.status(400).send({ status: false, message: "Please Add UserId" })
        }
        if (!isNumberstring(employee)) { return res.status(400).send({ status: false, message: "Employee Id Consists Number And String not a Space" }) }
        const uniqueemplyerId = await EmployeeId.findOne({ userName: employee })
        if (uniqueemplyerId) {
            return res.status(400).send({ status: false, message: "This User Name Is Already Present" })
        }

            const savedEmplyerId = await EmployeeId.create({ userName: req.body.id })
            res.status(200).send({ status: true, message: "You Have Successfully Add Emp ID: " })
    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}


////////////////////////EmployerIdSchema/////////////////////////////////////////////


const adminlogout = async (req, res) => {
    try {
        let tokens = req.cookies.Access_token
        if (tokens) {
            res.clearCookie("Access_token")
            res.json({ success: true, message: 'Sign out successfully!' });
        } else {
            res.status(422).send({ status: false, message: "You are already logged out" })
        }
    }
    catch (err) { return res.status(500).send({ status: false, msg: err.massage }) }
};


const getUserName=async(req,res)=>{
    try {
        let response=await User.find({empStatus:"Enable"}).select({userName:1,employeeId:1,name:1}).sort({createdAt:-1}).sort({createdAt:-1})
        // const response=await Lead.find({userName:userName}).select({"work":1,"logs":1,"status":1,"tasks.name":1,"tasks.contact":1,"tasks.email":1,"createdAt":1,"updatedAt":1})
        if(response.length==0 || response==undefined){
            res.status(200).json({status:true,message:[]})
        }else{
            res.status(200).json({status:true,message:response})
        }

    } catch (error) {
        res.status(400).json({status:false,message:error.message})
    }
    
}
const userStatus=async(req,res)=>{

    const userName=req.body.userName
    const empStatus=req.params.empStatus
   
    const response=await User.findOne({userName})
    let data;
    if(empStatus=="Enable"){
        data=false
    }else if(empStatus=="Disable"){
        data=true
    }else if(empStatus=="Delete"){
     data=true
    }else{

    }
    if(!response){
        res.status(200).json({status:false,message:"Invalid UserName"})
    }else if(empStatus=="Enable"){
        await User.updateOne({userName},{$set:{empStatus:`${empStatus}`}})
        await EmployeeId.updateOne({userName},{$set:{isDeleted:data}})
        res.status(200).json({status:true,message:"Sucessfull"})
    }else if(empStatus=="Disable"){
        await User.updateOne({userName},{$set:{empStatus:`${empStatus}`,token:""}})
        await EmployeeId.updateOne({userName},{$set:{isDeleted:data}})
        res.status(200).json({status:true,message:"Sucessfull"})
    }else if(empStatus=="Delete"){
        await User.updateOne({userName},{$set:{empStatus:`${empStatus}`,token:""}})
        await EmployeeId.updateOne({userName},{$set:{isDeleted:data}})
        res.status(200).json({status:true,message:"Sucessfull"})
    }else{
        res.status(400).json({status:false,message:"Error"})
    }
}

const employeeDetails=async(req,res)=>{
    try {
        const userName=req.params.userName;
    const response=await Lead.find({userName:userName}).select({"work":1,"logs":1,"status":1,"tasks.name":1,"tasks.contact":1,"tasks.email":1,"createdAt":1,"updatedAt":1}).sort({createdAt:-1})
    if(response.length==0 || response==undefined){
        res.status(200).json({status:true,message:[]})
    }else{
        res.status(200).json({status:true,message:response})
    }
    // res.status(200).json({status:true,message:response})
    } catch (error) {
    res.status(500).json({status:false,message:error})
        
    }
    
}
const allUserId = async (req, res) => {
    try {
        const data = await User.find().select({ userName: 1, _id: 0,empStatus:1,name:1}).sort({createdAt:-1})
       let r=data.filter((item)=>item.empStatus!="Delete")
        if (data.length == 0) {
            return res.status(404).send({ status: false, message: [] })
        }
        res.status(200).send({ status: true, message: r })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const getAllRemider=async(req,res)=>{
    try {
        let response=await Lead.find({status:"Reminder",isDeleted:false}).select({userName:1,reminder:1,"tasks.name":1}).sort({createdAt:-1})
        if(response.length==0 || response==undefined){
            res.status(200).json({status:true,message:[]})
        }else{
            res.status(200).json({status:true,message:response})
        }
        
    } catch (error) {
        res.status(500).json({status:false,message:error})
        
    }

}

const epmpoyeeIdList=async(req,res)=>{
    try {
         let response=await EmployeeId.find().sort({createdAt:-1})
         res.status(200).json({status:true,message:response})

    } catch (error) {
        res.status(500).json({status:false,message:error})
    }
}
module.exports = { adminRegister, adminLogin, adminreset, admiemailsend, adminverfiypassword, adminchangepassword, generateEmployeeId, adminlogout,getUserName ,employeeDetails,userStatus,allUserId,getAllRemider,epmpoyeeIdList};


















