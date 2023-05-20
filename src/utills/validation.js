const isValid = function (value) {
    if ( typeof value == null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
}

const isValidRequest = function(body){
    if(Object.keys(body).length ===0) return false;
    return true;
}

const isValidName = function(name){
    return /^[a-zA-Z ]{2,30}$/.test(name)
}

const isValidPincode = function(num){
    return /^[1-9]{1}[0-9]{2}[0-9]{3}$/.test(num)
   
  }
  
  const isValidPhone = function(phone) {
    return/^((?!(0))[0-9]{10})$/.test(phone)
  }

  const isValidEmail = function(Email) {
    return /^(?=.{1,30}$)[a-zA-Z0-9_\.]+\@(([a-z])+\.)+([a-z]{2,4})$/.test(Email)
  }

  const isValidPwd = function(Password)  {
    return  /^[0-9]{4}$/.test(Password)
  }

  const isValidObjectId = function(ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
  }

 




module.exports={isValid, isValidRequest,isValidName ,isValidPincode, isValidPhone,isValidEmail,isValidPwd,isValidObjectId,}
