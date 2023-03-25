const express=require("express")
const jwt=require("jsonwebtoken");
const cookieParser=require('cookie-parser');
const secreat="this is your secreat";
// let flag=false;

const middle=async(req,res,next)=>{

    console.log("enterd in middleware")
    // console.log(req.cookies);
    const token=await req.cookies.user;
    if(token){
        jwt.verify(token,secreat,async(err,decodedtoken)=>{
            if(err){
                // console.log('not corrct token');
                console.log(err);
                res.send(err);
            }
            else{
                // req.user=decodedtoken.user;
                console.log(decodedtoken);
                const p=await decodedtoken.id;
                console.log(p)
                req.body=await {...req.body,"user":p};
                // flag=true;
                console.log(req.body.user)
                next();
                // console.log(req);
            }
        })
    }
    else{
        req.body.err="not accessible";
        next()
    }
}

module.exports=middle;