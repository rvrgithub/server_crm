let jwt = require("jsonwebtoken")
const mongoose = require('mongoose');
const adminModel = require("../models/adminModel")


//============================================[Authentication Middleware]==========================================================

const authentication = async function (req, res, next) {
    try {
        let token = req.headers["x-api-key"] || req.headers["x-Api-key"];
        if (!token) return res.status(401).send({ status: false, message: "Missing authentication token in request" });

        decodedToken = jwt.verify(token, "admin panel")
        // console.log(decodedToken)
        req.decodedToken = decodedToken


        next();



    } catch (error) {
        if (error.message == 'invalid token') return res.status(400).send({ status: false, message: "invalid token" });

        if (error.message == "jwt expired") return res.status(400).send({ status: false, message: "please login one more time, token is expired" });

        if (error.message == "invalid signature") return res.status(401).send({ status: false, message: "invalid signature" });

        return res.status(500).send({ status: false, message: error.message });
    }
};
module.exports.authentication = authentication


//==================================================[Authorisation Middleware]============================================================

const authorisation = async function (req, res, next) {
    try {
        let adminId = decodedToken.userId
        if (!adminId) {
            return res.status(400).json({ error: 'You enter invalid token' });
        }

        let adminLogin = await adminModel.findOne({ _id: adminId });
        //  console.log(adminLogin)

        if (!adminLogin) {
            return res.status(404).send({ status: false, msg: "No such Admin exists" });
        }
        let addminLogging = adminLogin._id.toString()
        if (adminId !== addminLogging)
            return res.status(403).send({ status: false, msg: "Error, authorization failed" });

        next()
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.msg })
    }
}

module.exports.authorisation = authorisation