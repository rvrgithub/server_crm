const express = require('express')
const router = express.Router()
const { userRegister, userLogin, employeeLeads, notInterested, singleLead, statusUpdate, workUpdate, myProfile, labelUpdate, reminderUpdate, logUpdate, codeSend
    , varifyOtp, resetPassword, leadCount, acceptLead, reminderDetails } = require('../controllers/userController');
const { protect } = require("../middleWare/auth1")
const { adminRegister, adminLogin, adminreset, admiemailsend, adminverfiypassword, adminchangepassword, generateEmployeeId, adminlogout, getUserName, employeeDetails, userStatus, allUserId, getAllRemider,epmpoyeeIdList } = require('../controllers/adminController')
const { authentication, authorisation } = require('../middleWare/auth')
// leads router
const { allocateLeads, reAllocateLeads, reAssignLeads, getAllLeads, getLeads, getLeadsByStatus, updateLeadsStatus, deleteLeads, getSingleLeads } = require('../controllers/leadsController');



// user register 
router.post('/userRegister', userRegister);
//login user
router.post('/userLogin', userLogin);
//to see own profile details
router.get('/profile', protect, myProfile)
//employee show own all leada
router.get('/employee/leads/:status', protect, employeeLeads)
//lead accept Allocated to Pending
router.put('/accept/lead', protect, acceptLead)
// lead count
router.get('/count/lead', protect, leadCount)
//employee see one particular lead
router.post('/singleLead', protect, singleLead)
//update status 
router.post('/status/update', protect, statusUpdate)
// update work status
router.post('/work/update', protect, workUpdate)
//employee update the lead as not interested
router.post('/notInterested', protect, notInterested)
//employee update the leads
router.post('/labelUpdate', protect, labelUpdate)
// update reminder
router.post('/reminderUpdate', protect, reminderUpdate)
//update call logs
router.post('/logUpdate', protect, logUpdate)
//sending password forget otp
router.post('/sendcode', codeSend)
//varifying otp
router.post('/varify/otp', protect, varifyOtp)
//reset password
router.post('/reset/password', protect, resetPassword)
router.get('/reminder/details', protect, reminderDetails)



//Amdin Routes
router.post('/adminRegister', adminRegister)
router.post('/adminLogin', adminLogin);
router.post('/adminreset,authentication, authorisation,', adminreset);
router.post('/admiemail', admiemailsend)
router.post('/adminverfiypassword', authentication, authorisation, adminverfiypassword);
router.post('/adminchangepassword', authentication, authorisation, adminchangepassword);
router.post('/generateId', generateEmployeeId)
router.post('/adminlogout', adminlogout)
//return employeeid username .reassign and reallocated
router.get('/empId', getUserName)
//update employee enable /disable/delete
router.post('/employee/status/:empStatus', userStatus)
// showing all userName enable and disable
router.get('/allEmployee/id', allUserId)
// get employee details on setting userName parameter
router.get('/employee/:userName', employeeDetails)
router.get('/allemployee/reminder',authentication, authorisation,  getAllRemider)
router.get('/employeeId/list',authentication, authorisation,epmpoyeeIdList)



//Leads Controls
router.post('/leads', authentication, authorisation, allocateLeads);
router.post('/single/lead', authentication, authorisation, getSingleLeads);
router.post('/reAllocate', authentication, authorisation, reAllocateLeads);
router.post('/reAssignLeads', authentication, authorisation, reAssignLeads);
router.get('/getAllLeads', authentication, authorisation, getAllLeads)
router.get('/getLeads', authentication, authorisation, getLeads);
router.get('/leads/:status', authentication, authorisation, getLeadsByStatus);
router.put('/updateStatus', authentication, authorisation, updateLeadsStatus);
router.delete('/deleteLeads', authentication, authorisation, deleteLeads);

module.exports = router;