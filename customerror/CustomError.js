class customError extends Error{
    constructor(message,errorCode,property){
        super(message);
        this.code=errorCode;
        this.attribute=property;
    }
};

module.exports=customError;
