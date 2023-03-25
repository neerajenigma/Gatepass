const mongoose=require("mongoose");
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/Gatepass').then(()=>{
    console.log("success");
}).catch((err)=>{
    console.log("failure");
    console.log(err);
})