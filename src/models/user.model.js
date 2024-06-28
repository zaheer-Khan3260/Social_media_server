import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken" // generate refresh and access token
import bcrypt from "bcrypt"  // to encrypt the password


const userSchema = new Schema(
    {
        username: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        
        email: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        
        fullname: {
            type: String,
            require: true,
            trim: true,
            index: true
        },
        bio: {
            type: String,
        },
        
        avatar: {
            type: String, // cloudinary url
        },

        password : {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        },
         
    },
    {
        timestamps: true
    }
)

// method to encrypt password when it is saved in the mongodbAtlas 
// in this method use keyword "pre" pre means do something before something happen "pre" keyword
//takes two thing as a aggrument first is when and what sp, in this use save do before saving the password make this function 
// in that function we encrypt the password
userSchema.pre("save", async function (next) {
     if(!this.isModified("password")) return next(); // this line means when password doesn't modified then just simply go next no need to encrypt the password

    this.password = await bcrypt.hash(this.password, 10);
    next()
}
)

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id, 
             
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema);




