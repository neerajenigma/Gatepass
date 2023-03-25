const mongoose=require("mongoose");
const validator=require("validator");
const bcrypt=require("bcrypt");
const { default: isEmail } = require("validator/lib/isEmail");

const user_s=new mongoose.Schema({
    email:{
        type: String,
        unique:true,
        required:[true,'please enter an email'],
        validate:{
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email',
            isAsync: false
          }  
    },
    passwd:{
        type: String,
        required:[true,'please enter password']   
    },
    usertype:{
        type: String,
        required: [true,'please select your user type']
    },
    name:{
        type : String,
        required: [true,'please enter your name']
    },
    person_id:{
        type: String,
        required: [true,'please enter id']
    },
    person_id_type:{
        type: String,
        required: [true,'please enter id']
    },
    mobnumber:{
        type: Number,
        // required: [true,'please enter number']
    },
    department:{
        type: String,
        default: ""
        // required: [true,'please enter your department']
    },
    hostel:{
        type: String,
        default: ""
    },
    dob:{
        type: Date,
        // default: ""
    },
    degree:{
        type: String,
        default: ""
    },
    yearofadmission:{
        type: Date,
        // default: ""
    },
    status:{
        type: String,
        default: "pending"
    },
    peraddress:{
        type: String,
        default: ""
    },
    user_power:{
        type: String,
        default: ""
    }
})

const gatepass_s=new mongoose.Schema({
    user_id:{

    },
    usertype:{
        type: String,
        required: [true,'please select your user type']
    },
    name:{
        type : String,
        required: [true,'please enter your name']
    },
    person_id:{
        type: String,
        required: [true,'please enter id']
    },
    mobnumber:{
        type: Number,
        // required: [true,'please enter number']
    },
    hostel:{
        type: String,
        default: ""
    },
    status:{
        type: String,
        default: "pending"
    },
    purpose:{
        type: String,
        default: ""
    },
    entry_date:{
        type: String,
        default: ""
    },
    exit_date:{
        type: String,
        default: ""
    },
    apply_date:{
        type: String,
        default: ""
    },
    action_date:{
        type: String,
        default: ""
    },
    action_by:{

    },
    in:{
        type: String,
        default: ""
    },
    out:{
        type: String,
        default: ""
    },
    message:{
        type: String,
        default: ""
    }
})

user_s.pre('save',async function(next){
    const salt= await bcrypt.genSalt();
    this.passwd=await bcrypt.hash(this.passwd,salt);
    next();
})

const user=new mongoose.model("USER",user_s)
const gatepass=new mongoose.model("GATEPASS",gatepass_s)
module.exports={user,gatepass}