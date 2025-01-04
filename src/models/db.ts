import { link } from 'fs';
import mongoose, {model, Model, Schema} from 'mongoose'
import { title } from 'process';
import { string } from 'zod';

  
mongoose.connect(process.env.MONGO_URL!);
  

const UserSchema = new Schema({
    username : {type: String, unique: true},
    password : String,
    email: String
})


export const UserModel = model("User", UserSchema );


const ContentSchema = new Schema({
    title: String,
    description: String,
    link: String,
    tags: [{type: String}],
    type: String,
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true},
    date: String,
    // contentId : {type : mongoose.Types.ObjectId,ref:'contentId', required:true}

})

const LinkSchema = new Schema({
    hash: String,
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true ,
        unique:true
    }
    
})

export const LinkModel = model("Links", LinkSchema);
export const ContentModel = model("Content", ContentSchema)