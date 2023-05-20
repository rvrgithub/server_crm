

const Leads = require('../models/leadsModel');
const Users = require('../models/userModel')
const FCM=require("fcm-node")
const { isValid, isValidRequest, isValidName, isValidPhone, isValidEmail } = require('../utills/validation');
const EmployeeId = require('../models/employeeIdSchema');
const SERVER_KEY="AAAAWG4brsw:APA91bGAb7BUj9mcbIR3PlsW-fGHPBY34E0O01LebeQ7cPz9_35IvJL_JHaRcMaLlQTBm8pFxxKTHgmj_ZOPkGZgrYz2qYNif5U93FxbE1uCiUtWyYGeBgXcaETiBBDVFIbmg2Cnrmzf"

// Allocate leads to employee
const allocateLeads = async (req, res) => {
    try {
        const clientLeads = req.body.task;
        if (!isValidRequest(req.body)) {
            return res.status(422).send({ status: false, message: "Invalid! request" })
        }
        if (clientLeads.length === 0)
            return res.status(400).send({ status: false, message: "Leads are empty" });

        const validClientLeads = clientLeads.filter(
            (ele) => ele.name && ele.email && ele.contact
        );
        if (validClientLeads.length !== clientLeads.length)
            return res
                .status(400)
                .send({ status: false, message: "Client info is missing" });

        const arr = validClientLeads.map((ele) => ({
            name: ele.name,
            email: ele.email.toLowerCase(),
            contact: ele.contact,
            message: ele.message,
            assigned: false
        }));

        const employees = await Users.find({empStatus:"Enable"})
        const numberOfEmployees = employees.length;
        const numberOfLeads = arr.length;
        const leadsPerEmployee = Math.floor(numberOfLeads / numberOfEmployees);
        var remainingLeads = numberOfLeads % numberOfEmployees;
        for (let i = employees.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [employees[i], employees[j]] = [employees[j], employees[i]];
        }
let employeeList= new Set()
        let leadsAssigned = 0;
        const assignedLeads = [];
        let leadIndex = 0;
        for (let i = 0; i < numberOfEmployees; i++) {
            const employee = employees[i];
            const employeeLeads = await Leads.find({ employeeId: employee.employeeId });
            const numberOfEmployeeLeads = employeeLeads.length;
            let leadsToAssign = leadsPerEmployee;

            if (remainingLeads > 0) {
                leadsToAssign++;
                remainingLeads--;
            }

            for (let j = 0; j < leadsToAssign; j++) {
                if (leadIndex >= numberOfLeads) break;

                const leadToAssign = arr[leadIndex];

                leadToAssign.assigned = true;
                const assignedLead = await Leads.create({
                    employeeId: employee.employeeId,
                    userName: employee.userName,
                    assignTo: employee.name,
                    tasks: [leadToAssign],
                });
                assignedLeads.push(assignedLead);
             employeeList.add(employee.notifyToken)
                leadIndex++;
            }
        }
        return res.status(200).send({ status: true, leads: assignedLeads });
    } catch (error) {
        return res.status(500).send({status:false, error:error.message})
    }
}

const reAllocateLeads = async (req, res) => {
    console.log(req.body)
    try {
        var { name, email, contact, employeeId, message,userName } = req.body;
        console.log(employeeId)
        if (isNaN(employeeId)) {
            return res.status(422).send({ status: false, message: "Invalid employee id" })
        } else if (!name || !email || !contact) {
            return res.status(400).send({ status: false, message: "Required fileds Are Missing" })
        } else if (!isValid(name) || !isValidName(name)) {
            return res.status(422).send({ status: false, message: "Invalid!  Name" })
        } else if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "Clients Email Is Invalid!" })
        } else if (!isValidPhone(contact)) {
            return res.status(422).send({ status: false, message: "Invalid! Phone Number" })
        }
        let userDetails=await Users.findOne({userName})
        console.log(userDetails)
        if(userDetails==null){
        }else{
      if(userDetails.employeeId==employeeId){
        return res.status(400).send({ status: false, message: "Already Employee Have This Lead" })

      }else{
      let updated= await Leads.updateMany({"userName":userName,"tasks.email":email,isDeleted:false},{$set:{"isDeleted":true}})

      }
        }
       const employeeData = await Users.findOne({ employeeId: employeeId });
        console.log(employeeData)
       if (!employeeData) return res.status(404).send({ status: false, message: "Invalid EmployeeID" })
    //    if(employeeData.employeeId==employeeId) return res.status(404).send({ status: false, message: "Already Assign This Lead Same Employee" })
        let fcm = new FCM(SERVER_KEY)
                var smsm = {
                    to:employeeData.notifyToken,
                    notification: {
                        title: "New Leads",
                        body: "You are getting a new lead .Please check your status",
                        sound: "default",
                    }
                }
                fcm.send(smsm, (err, response) => {
                    if (err) {
                       console.log(err)
                    } else {
                        console.log(response)
                    }
                })
        let newLeads = {
            employeeId: employeeId,
            userName:employeeData.userName,
            assignTo: employeeData.name,
            tasks: [{
                "name": name, "email": email.toLowerCase(), "contact": contact, "message": message
            }]
        }
        await Leads.create(newLeads);
        return res.status(201).send({ status: true, message: "Leads added successfully!" })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};

// reassign leads to an employee
const reAssignLeads = async (req, res) => {
    

    try {
        const { assignTo, name, email, contact, message, userName } = req.body
        console.log(userName)
        if (!assignTo || !name || !email || !contact || !message || !userName) {
            return res.status(400).send({ status: false, message: "leads information is missing!" })
        }if (!isValid(name) || !isValidName(name)) {
            return res.status(422).send({ status: false, message: "Invalid! Client name" })
        } else if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "Invalid! email" })
        } else if (!isValidPhone(contact)) {
            return res.status(422).send({ status: false, message: "Invalid phone number" })
        } else if (!isValid(userName)) {
            return res.status(422).send({ status: false, message: "Invalid userName" })
        }
        let verifyLeads = await Leads.findOne({ assignTo: assignTo, 'tasks.email': email,isDeleted:false })
    
        if(verifyLeads.userName==userName){
            return res.status(404).json({
                status: false, message: "Already Employee Have This Lead"

            })
        }
        if (!verifyLeads) {
            return res.status(404).send({
                status: false, message: "This leads doesn't belongs to any employee"

            })

        }
        let empInfo = await Users.findOne({ userName: userName })
       if (!empInfo) {
            return res.status(422).send({ status: false, message: "Invalid! userName" })
        }


        let a = await Leads.create({
            employeeId: empInfo.employeeId,
            userName: empInfo.userName,
            assignTo: empInfo.name,
            tasks: [{
                "name": name,
                "email": email,
                "contact": contact,
                "message": message
            }]
        });
        let fcm = new FCM(SERVER_KEY)
        var smsm = {
            to:empInfo.notifyToken,
            notification: {
                title: "New Leads",
                body: "You are getting a new lead .Please check your status",
                sound: "default",

            }
        }
        fcm.send(smsm, (err, response) => {
            if (err) {
               console.log(err)
            } else {
                console.log(response)
            }
        })
        
        let b = await Leads.updateMany({ employeeId: verifyLeads.employeeId, "tasks.email": email,isDeleted:false }, {$set:{ isDeleted: true} })

        res.status(200).send({ status: true, message: "Thank you! for leads reassigning" })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}
// get all leads
const getAllLeads = async (req, res) => {
    try {
        let data = await Leads.find({ status: "Allocated", isDeleted: false }).sort({createdAt:-1})
        let modifiedLeads = []
        data.map((ele) => {
            let newObj = {
                employeeId: ele.employeeId,
                userName:ele.userName,
                assignTo: ele.assignTo,
                name: ele.tasks[0].name,
                email: ele.tasks[0].email,
                contact: ele.tasks[0].contact,
                message: ele.tasks[0].message
            }
            modifiedLeads.push(newObj)
        })
        res.status(200).send({ status: true, leads: modifiedLeads })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}

// get lattest leads
const getLeads = async (req, res) => {
    try {
        var leadsData = await Leads.find({ isDeleted: false }).sort({ updatedAt: -1 })
        var arr = leadsData
        let result = []
        var map = new Map()
        for (let i = 0; i < arr.length; i++) {
            if (!map.has(arr[i].tasks[0].email)) {
                map.set(arr[i].tasks[0].email, arr[i])
                result.push(arr[i])

            } else {
                continue;
            }
        }
        res.status(200).send({ status: true, leads: result })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}
//  get leads by status
const getLeadsByStatus = async (req, res) => {
    try {
        let status = req.params.status
        if (!status) return res.status(400).send({ status: false, message: "Status is required" })
        if (!["Allocated", "Pending", "Not Interested", "Complete"].includes(status) || !isValid(status)) {
            return res.status(422).send({ status: false, message: "Invalid! Status" })
        }
        const leadsStatus = await Leads.find({ status: status, isDeleted: false }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 }).sort({createdAt:-1});
        if (leadsStatus.length === 0) {
            return res.status(200).json({status: true, leads:[]})
        }
        let filteredLeads = []
        leadsStatus.map((ele) => {
            let newObj = {
                employeeId: ele.employeeId,
                assignTo: ele.assignTo,
                name: ele.tasks[0].name,
                email: ele.tasks[0].email,
                contact: ele.tasks[0].contact,
                message: ele.tasks[0].message
            }
            filteredLeads.push(newObj)
        })

        return res.status(200).send({ status: true, leads: filteredLeads });
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};
// get single leads by client email
const getSingleLeads = async(req, res)=>{
    const clientEmail = req.body.email
    const leads = await Leads.find({"tasks.email":clientEmail})
    res.status(200).send({status:true, leads:leads})
};

const getLeadsByEmployeeId = async(req,res)=>{
    const empId = req.body.id
    const empLeads = await Leads.find({employeeId:empId})
    res.status(200).send({status:true, empLeads})
}

const updateLeadsStatus = async (req, res) => {
    try {
        const { employeeId, email, status } = req.body
        if (!employeeId && employeeId !== 0) return res.status(400).send({ status: false, message: "Employee id is required" })
        if (isNaN(employeeId)) return res.status(400).send({ status: false, message: "Id should be number only" })
        if (!email || !status) {
            return res.status(422).send({ status: false, message: "Email and status are required to update" })
        }
        if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "Invalid! email" })
        }
        if (!["Pending", "Not Interested", "Complete"].includes(status) || !isValid(status)) {
            return res.status(422).send({ status: false, message: "Invalid! Status" })
        }
        const updatedStatus = await Leads.findOneAndUpdate({ employeeId: employeeId, 'tasks.email': email }, { $set: { status: status } })
        if (!updatedStatus) {
            return res.status(404).send({ status: false, message: "Leads not found" })
        }
        res.status(200).send({ status: true, message: "Status updated successfully", updatedStatus });
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};
// Delete leads by admin
const deleteLeads = async (req, res) => {
    console.log(req.body)
    try {
        const { employeeId, email } = req.body
        if (!employeeId && employeeId !== 0 || !email) {
            return res.status(422).send({ status: false, message: "employee id and email are required!" })
        } else if (isNaN(employeeId)) {
            return res.status(422).send({ status: false, message: "Invalid! employee id" })
        } else if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "Invalid email" })
        }

        let deletedLeads = await Leads.updateMany({ employeeId: employeeId, "tasks.email": email }, { isDeleted: true })
        if (!deletedLeads) {
            return res.status(404).send({ status: false, message: "Leads not found" })
        }
        res.status(200).send({ status: true, message: "Leads deleted successfully!" })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};


module.exports = { allocateLeads, reAllocateLeads, reAssignLeads, getAllLeads, getLeads, getLeadsByStatus, updateLeadsStatus, deleteLeads,getSingleLeads }