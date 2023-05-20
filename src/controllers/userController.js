const { isValidRequest, isValidEmail, isValidPwd, isValidPhone, isValidName } = require('../utills/validation')
const Users = require('../models/userModel');
const adminModel = require('../models/adminModel');
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const cookie = require('cookie');
const generateToken = require("../utills/generateToken")
const Leads = require("../models/leadsModel")
const EmployeeId = require("../models/employeeIdSchema")
const nodemailer = require("nodemailer");
const { reset } = require('nodemon');
const FCM = require("fcm-node")
const SERVER_KEY = "AAAAWG4brsw:APA91bGAb7BUj9mcbIR3PlsW-fGHPBY34E0O01LebeQ7cPz9_35IvJL_JHaRcMaLlQTBm8pFxxKTHgmj_ZOPkGZgrYz2qYNif5U93FxbE1uCiUtWyYGeBgXcaETiBBDVFIbmg2Cnrmzf"
// register Users
const userRegister = async (req, res) => {
    try {
        const newUser = req.body
        let { userName, name, email, mobile, password, confirmPassword } = newUser
        let lastId = await Users.find().count()
        // let employeeId = lastId+1;
        if (!name || !email || !mobile || !password || !confirmPassword || !userName || !isValidRequest(newUser)) {
            return res.status(400).send({ status: false, Message: "All fields are required" })
        }
        const isUsed = await Users.findOne({ email: email })
        const alreadyUsedEmployeeId = await Users.findOne({ "userName": newUser.userName })
        const validEmployeeId = await EmployeeId.findOne({ "userName": newUser.userName })
        if (alreadyUsedEmployeeId) {
            return res.status(409).send({ status: false, Message: "This EmployeeId Already Used" })
        }
        if (!validEmployeeId) {
            return res.status(409).send({ status: false, Message: "This EmployeeId not valid" })
        }
        if (isUsed) {
            return res.status(409).send({ status: false, Message: "This email is already used" })
        }
        if (!isValidName(name)) {
            return res.status(400).send({ status: false, Message: `Invalid name ${name}` })
        }
        else if (!isValidPhone(mobile)) {
            return res.status(400).send({ status: false, Message: `Invalid mobile number ${mobile}` })
        }
        else if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, Message: `Invalid email ${email}` })
        } else if (!isValidPwd(password)) {
            return res.status(400).send({ status: false, Message: "Password should be 4 digit pin" })
        } else if (password != confirmPassword) {
            return res.status(400).send({ status: false, Message: "Password and Confirm Password Not Match" })
        }
        password = await bcrypt.hash(newUser.password, 10)
        const savedUser = new Users({
            employeeId: lastId + 1,
            userName: newUser.userName,
            name: newUser.name,
            mobile: newUser.mobile,
            email: newUser.email,
            password: password,
            confirmPassword: password
        })
        await savedUser.save()
        res.status(201).send({ status: true, Message:savedUser })

    } catch (error) {
        res.status(500).send({ status: false, Error: error.message })
    }
};

// login employee

const userLogin = async (req, res) => {
    try {
        const registeredUser = req.body
        const { email, password, token } = registeredUser
        if (!email || !password) {
            return res.status(400).send({ status: false, message: "Email and Password is required" })
        }
        const isValidUser = await Users.findOne({ email: registeredUser.email })
        const admin = await adminModel.findOne({ email: registeredUser.email })

        // console.log(isValidUser.empStatus)
        if (!isValidUser && !admin) {
            res.status(400).json({ status: false, message: "Invalid Credentials" })
            return;
        }

        if (isValidUser) {
            if (isValidUser.empStatus == "Delete") {
                res.status(400).json({ status: false, message: "User Not Found" })
                return;
            }
            if (await bcrypt.compare(registeredUser.password, isValidUser.password)) {
                await Users.updateOne({ "_id": isValidUser._id }, { $set: { "notifyToken": registeredUser.token } })
                res.status(200).json({
                    status: true, message:
                    {
                        _id: isValidUser._id,
                        userName: isValidUser.userName,
                        name: isValidUser.name,
                        email: isValidUser.email,
                        mobile: isValidUser.mobile,
                        role: isValidUser.role,
                        token: generateToken(isValidUser._id),
                        notifyToken: isValidUser.notifyToken
                    }
                })
            } else {
                res.status(400).json({ status: false, message: "Invalid Credentials" })

            }
        } else if (admin) {
            if (await bcrypt.compare(registeredUser.password, admin.password)) {
                await adminModel.updateOne({ "_id": admin._id }, { $set: { "notifyToken": registeredUser.token } })

                let token = jwt.sign({
                    userId: admin._id.toString()       //to remove Object_id
                }, "admin panel", { expiresIn: '50d' })
                res.status(200).json({
                    status: true, message:
                        { role: admin.role, token: token }
                })
            } else {
                res.status(400).json({ status: false, message: "Invalid Credentials" })

            }
        } else {
            res.status(400).json({ status: false, message: "Invalid Credentials" })
        }

    } catch (err) {
        res.status(400).json({ status: false, message: err })

    }
}


// sendind opt through email
const codeSend = async (req, res) => {
    try {
        if (req.body.email == "" || req.body == undefined || req.body.email == undefined) {
            return res.status(400).send({ status: false, message: "Please fill the input box" })
        }
        const user = await Users.findOne({ "email": req.body.email })

        const admin = await adminModel.findOne({ "email": req.body.email })
        if (!user && !admin) {
            return res.status(400).send({ status: false, message: "Invalid Email" })

        }
        if (user) {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user:process.env.EMAIL_NAME,
                    pass: process.env.EMAIL_PASS
                }
            });
            let otpnum = Math.floor(Math.random() * 90000) + 10000;
            let addotp = await Users.findOneAndUpdate({ "email": req.body.email }, { $set: { otp: otpnum } })

            var mailOptions = {
                from: process.env.EMAIL_NAME,
                to: `${req.body.email}`,
                subject: `Reset Password`,
                text: `
                Please use the following OTP Code to reset your password: ${otpnum}

                If you did not request a password change, please feel free to ignore this message.
                
                If you have any comments or questions don't hesitate to reach us at ${process.env.EMAIL_NAME}
                Please feel free to respond to this email. It was sent from a monitored email address, and we would love to hear from you.

                Thanks,
                The GoodWill Homz Team
        `
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }

            });
            const token = generateToken(user._id)
            res.status(200).json({ status: true, message: { token: token, role: user.role } })
        } else if (admin) {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user:process.env.EMAIL_NAME,
                    pass: process.env.EMAIL_PASS
                }
            });
            let otpnum = Math.floor(Math.random() * 90000) + 10000;
            let addotp = await adminModel.findOneAndUpdate({ "email": req.body.email }, { $set: { otp: otpnum } })

            var mailOptions = {
                from: process.env.EMAIL_NAME,
                to: `${req.body.email}`,
                subject: `Reset Password `,
                text: `
                Please use the following OTP Code to reset your password: ${otpnum}

                If you did not request a password change, please feel free to ignore this message.
                
                If you have any comments or questions don't hesitate to reach us at ${process.env.EMAIL_NAME}
                Please feel free to respond to this email. It was sent from a monitored email address, and we would love to hear from you.

                Thanks,
                The GoodWill Homz Team
                
        `
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }

            });
            let token = jwt.sign({
                userId: admin._id.toString()       //to remove Object_id
            }, "admin panel", { expiresIn: '50d' })

            res.status(200).json({ status: true, message: { "token": token, "role": admin.role } })


        }

    } catch (err) {
        res.status(500).json({ status: false, message: err })
    }
}

// varify otp of email and database



const varifyOtp = async (req, res) => {
    if (!req.body.otp) {
        return res.status(400).json({ status: false, message: "Please Put Your Otp" })

    }
    const varifyOtp = await Users.findOne({ "_id": req.user._id })

    if (!varifyOtp) {
        res.status(400).json({ status: false, message: "Time Limit Expiry" })
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

// reset password
const resetPassword = async (req, res) => {
    try {

        if (req.body.password == "" || req.body == undefined || req.body.password == undefined) {
            return res.status(400).send({ status: false, message: "Please fill the input box" })
        }
        else if (!isValidPwd(req.body.password)) {
            return res.status(400).send({ status: false, message: "Password should be 4 digit pin" })
        } else {
            let hashPass = await bcrypt.hashSync(req.body.password, 10)
            let sucess = await Users.findByIdAndUpdate({ "_id": req.user._id }, { $set: { "password": hashPass } })
            res.status(200).json({ status: true, message: "Successful reset password" })

        }
    } catch (error) {
        res.status(400).json({ status: false, message: error })
    }
}



// getting own profile
const myProfile = async (req, res) => {
    try {
        let response = await Users.findOne({ "_id": req.user._id })
        res.status(200).json({
            userName: response.userName,
            name: response.name,
            email: response.email,
            mobile: response.mobile,
        })
    } catch (error) {
        res.status(500).json(error)
    }
}



const employeeLeads = async (req, res) => {
    try {
        let arr = []
        if (req.params.status == "Allocated" || req.params.status == "Pending") {
            let responce = await Leads.find({ "userName": req.user.userName, "status": req.params.status, isDeleted: false }).select({ "tasks": 1 }).sort({createdAt:-1})
            
            responce.map((item) => {
                arr.push(...item.tasks)
            })
            // console.log(arr)
            res.json(arr)
        } else if (req.params.status == "Not Interested" || req.params.status == "Complete") {
            let responce = await Leads.find({ "userName": req.user.userName, "status": req.params.status }).select({ "tasks": 1 }).sort({createdAt:-1})
            responce.map((item) => {
                arr.push(...item.tasks)
            })
            res.json(arr)
        }
    } catch (error) {
        res.status(500).json(error)
    }
}


// lead count
const leadCount = async (req, res) => {
    try {
        let responce = await Leads.find({ "userName": req.user.userName, "isDeleted": false })
        let response2 = await Leads.find({ "userName": req.user.userName })
        let Allocated = responce.filter((item) => item.status == "Allocated")
        let Pending = responce.filter((item) => item.status == "Pending")
        let Complete = response2.filter((item) => item.status == "Complete")
        let NotInterested = response2.filter((item) => item.status == "Not Interested")
        let count = {
            Allocated: Allocated.length,
            Complete: Complete.length,
            Pending: Pending.length,
            NotInterested: NotInterested.length,
        }
        res.status(200).json(count)
    } catch (error) {
        res.status(400).json("Not valid")
    }
}

// single leads of employee
const singleLead = async (req, res) => {
    if (req.body.email == "") {
        res.status(500).json("Please give lead email")
    }
    try {
        let response = await Leads.findOne({ "tasks.email": req.body.email, "userName": req.user.userName, isDeleted: false })
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json(error)
    }
}

//accept leads status allocated change to pending

const acceptLead = async (req, res) => {
    try {
        let responce = await Leads.updateMany({ "userName": req.user.userName, "status": "Allocated", "isDeleted": false }, { $set: { "status": "Pending" } })
        res.json(responce)
    } catch (error) {
        res.json(err)
    }

}

//update status by employee pending
const statusUpdate = async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.status == undefined || req.body.status == "") {
            return res.status(500).json({
                status: false,
                message: "Invalid Email Id"
            })
        }
        let responce = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, status: "Pending", "isDeleted": false }, { $set: { "status": req.body.status } })
        if (!responce.modifiedCount == 1) {
            res.json({
                status: false,
                message: "Invalid Email Id"
            })
        } else {
            res.status(200).json({
                status: true,
                message: "Update successfully"
            })
        }
    } catch (err) {
        res.status(500).json({ status: false, message: err })
    }
}


//update work by employee pending
const workUpdate = async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.work == undefined || req.body.work == "") {
            return res.status(500).json({ status: false, message: "Please  give valid lead email and update work" })
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, "isDeleted": false }, { $set: { "work": req.body.work } })
        if (!response.modifiedCount == 1) {
            res.status(400).json({ status: false, message: "Put valid input" })
        } else {
            res.status(200).json({ status: true, message: "Updated successful" })
        }
    } catch (err) {
        res.status(500).json({ status: false, message: err })
    }
}
//label update
const labelUpdate = async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.label == undefined || req.body.label == "") {
            return res.status(500).json("Please  give valid lead email and update label")
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, "isDeleted": false }, { $set: { "label": req.body.label } })
        if (!response.modifiedCount == 1) {
            res.json("put valid input")
        } else {
            res.status(200).json("Updated successful")
        }
    } catch (err) {
        res.status(500).json(err)
    }
}
//reminder update
const reminderUpdate = async (req, res) => {
    console.log(req.body)

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.reminder == undefined || req.body.reminder == "") {
            return res.status(500).json("Please  give valid lead email and update reminder")
        }
        let data = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, "isDeleted": false }, { $set: { status: "Reminder",reminder:req.body.date } })
        console.log(data)
        setTimeout(async () => {
            await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, "isDeleted": false }, { $set: { status: "Pending",reminder:"" } })
            res.json("successfull")
            let admin = await adminModel.find()
            let fcm = new FCM(SERVER_KEY)
            let message = {
                to: admin.notifyToken,
                notification: {
                    title: "Reminder !",
                    body: `${req.user.name} set the reminder of client ${req.body.leadName}`,
                    sound: "default",

                }
            }
            fcm.send(message, (err, response) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(response)
                }
            })

            let sms = {
                to: req.user.notifyToken,
                notification: {
                    title: "Reminder ! ",
                    body: `You are still in and it's after your reminder set time.
                    Please update status of client ${req.body.leadName}`,
                    sound: "default",

                }
            }
            fcm.send(message, (err, response) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(response)
                }
            })
        }, req.body.reminder*1000)
    } catch (err) {
        res.status(500).json(err)
    }
}
//update to reminder
const logUpdate = async (req, res) => {
    console.log("log updated")

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.logs == undefined || req.body.logs == "") {
            return res.status(500).json("Please  give valid lead email and update logs")
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, "isDeleted": false, status: "Pending" }, { $set: { "logs": req.body.logs } })
        if (!response.modifiedCount == 1) {
            res.json("put valid input")
        } else {
            res.status(200).json("Updated successful")
        }
    } catch (err) {
        res.status(500).json(err)
    }
}
//employee add status notinterested

const notInterested = async (req, res) => {
    try {
        if (req.body.email == "" || req.body.email == undefined) {
            res.status(500).json("Please give lead email ")
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, status: "Pending", "isDeleted": false }, { $set: { "status": "Not Interested" } })
        let admin = await adminModel.find()
        let fcm = new FCM(SERVER_KEY)
        let message = {
            to: admin[0].notifyToken,
            notification: {
                title: "Notinterested !",
                body: `Getting notinterested lead from employee ${req.user.name}`,
                sound: "default",

            }
        }
        fcm.send(message, (err, response) => {
            if (err) {
                console.log(err)
            } else {
                console.log(response)
            }
        })

        setTimeout(async () => {
            let data = await Leads.findOne({ "tasks.email": req.body.email })
            if (data.status == "Allocated") {
                res.json({ status: false, message: "Admin send the lead to other employee" })
                return;
            } else {
                let allUser = await Users.find()
                let data = await Leads.findOne({ "tasks.email": req.body.email })
                let random = Math.floor((Math.random() * allUser.length))
                await Leads.updateOne({ "userName": req.user.userName, "tasks.email": req.body.email }, { $set: { "status": "Not Interested" } })
                let fcm = new FCM(SERVER_KEY)
                let message = {
                    to: allUser[random].notifyToken,
                    notification: {
                        title: "New Lead",
                        body: "You are getting a new lead .Please check your status ",
                        sound: "default",

                    }
                }
                fcm.send(message, (err, response) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(response)
                    }
                })
                let assignUser = new Leads({
                    employeeId: allUser[random].employeeId,
                    userName: allUser[random].userName,
                    assignTo: allUser[random].name,
                    tasks: data.tasks[0]
                })
                await Leads.updateOne({ "userName": req.user.userName, "tasks.email": req.body.email }, { $set: { "status": "Not Interested", isDeleted: false } })

                await assignUser.save()
                res.json({ status: true, message: assignUser })
            }

        }, 120000)
    } catch (err) {
        res.status(500).json(err)
    }
}

const reminderDetails = async (req, res) => {
    try {
        let response = await Leads.find({ userName: req.user.userName, status: "Reminder" }).select({ "userName": 1, "reminder": 1,"tasks.name":1 }).sort({createdAt:-1})
        res.status(200).json({ status: true, message: response })
    } catch (error) {
        res.status(500).json({ status: false, message: error })

    }
}



module.exports = {
    userRegister, userLogin, leadCount, acceptLead, employeeLeads, singleLead, statusUpdate, workUpdate, notInterested, myProfile, labelUpdate, reminderUpdate, logUpdate, codeSend
    , varifyOtp, resetPassword, reminderDetails
};

//cqXw96cSQXCcEyo71ERpA4:APA91bGjMYgQqhZuoUmcuN4MgW6baP0fE2imKWg7nKctxnPW6wjJ8n9F9MIUm7J_oKzGhZg9lqf2kP8kITxTwVaX774KErsevN9f3A0KhwHVwU6bvHm7IOOVvqKGkNoLFPnlNKLUnrhT
//kishor

// ce17LLinRJafRetiRwuvI1:APA91bF3kK34SVCVVP_tXJxfCsdsT3sPOTPcGNqNQhDklfl87dCoNT-7lgCdJj0O2Bo7BY84V9yX22jir8uok9go_6INUy-tlNW9sBngl_ca7mV3jBbD1u1Uq73V593G1x1mvPG2V4DG
//chandra