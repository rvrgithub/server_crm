const jwt=require('jsonwebtoken')
const geterateToken=(id)=>{
return jwt.sign({id},"abcd123",{
    expiresIn:'30d'

})
}
module.exports=geterateToken