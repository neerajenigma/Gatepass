const customError=require("./CustomError");
const error=new customError("this is message",400,"all");
console.log(error);