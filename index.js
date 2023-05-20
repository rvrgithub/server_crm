const express = require('express');
const mongoose = require('mongoose');
const route = require('./src/routes/route');
const socket = require('socket.io');
require('dotenv').config()
const multer = require('multer')
const jwt=require("jsonwebtoken")
const app = express()
const cors=require("cors")
mongoose.set('strictQuery', false);
app.use(cors())
const Leads=require("./src/models/leadsModel")
const cookieParser=require("cookie-parser")
app.use(express.json());
app.use(cookieParser())
app.use(multer().any())


const connection_url = process.env.MONGO_URL
const PORT = process.env.PORT || 4000;

mongoose.connect(connection_url, {
    useNewUrlParser:true
})
.then(()=> console.log("Database is connected"))
.catch((err)=> console.log(err))

app.post("/getWho",(req,res)=>{
      console.log(req.body)
    let token=req.body.token;
    try {
        let user=jwt.verify(token,"abcd123")
    console.log(user)
    res.send("Employee")
    } catch (err) {
        if(err.message=="invalid signature"){
        let admin=jwt.verify(token,"admin panel")
        console.log(admin)
        res.send("Admin")
        }else{
            console.log(err)
        }
    }
    
//    if(!user){
//     let admin=jwt.verify(token,"admin panel")
//     console.log(admin)
//    }
//     //   res.json({admin,user})
//       console.log(user)
//       res.send("done")

})

app.use('/', route);


const server = app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`)
})

// const io = socket(server, {
//     cors: {
//       origin: "http://localhost:3000",
//       credentials: true,
//     },
//   });
  
//   let users = [];
// const addUser = (userId, socketId) => {
//     !users.some((user) => user.userId === userId) &&
//         users.push({ userId, socketId })
// }
// const removeUser = (socketId) => {
//     users = users.filter(user => user.socketId !== socketId)
// }


// const getUser = (userId) => {
//     return users.find(user => user.userId === userId)
// }
// io.on("connection", (socket) => {

//     console.log("a user connected")
//     socket.on("addUser", userId => {
//         addUser(userId, socket.id);
//         io.emit("getUsers", users)
//     })
    
// socket.on("increament",(store)=>{
//   let user=getUser(store.employeeId)
//   io.to(user.socketId).emit("getValue",store.value)
// })

//     socket.on("disconnect", () => {
//         console.log("disconnected")
//         removeUser(socket.id)
//     })
// })
