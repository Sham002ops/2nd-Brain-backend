import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt'
import z from 'zod'
import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { ContentModel, LinkModel, UserModel } from "./models/db";
import { JWT_PASSWORD } from "./config";
import { userMiddleware } from "./authMiddleware";
import { random } from "./models/RandomGen";
import { hash } from "crypto";
import { link } from "fs";
import cors from 'cors'
import { error, log } from "console";
const app = express();

app.use(
    cors({
        // origin: 'https://2nd-brain-vault.vercel.app', 
        // methods: ['GET', 'POST', 'PUT', 'DELETE'],
        // credentials: true, 
    })
  );

app.use(express.json());  

app.post("/api/v1/", async ( req: Request, res: Response) => { 
    console.log(`Server is running on port ${process.env.PORT}`);
    res.json({
        message: "Server is running"
    })
    
})
app.post("/api/v1/signup", async ( req: Request, res: Response) => {
    // zod validation
    try {
    const requiredBody = z.object({
        email: z.string()
            .min(3)
            .max(30, { message: "Email should not contain more then 30 letter" }),
        password: z.string()
            .regex(/[A-Z]/, { message: "Password must be contain at least one Capital letter" })
            .regex(/[a-z]/, { message: "Password must be contain at least one small letter" })
            .regex(/[0-9]/, { message: "Password must be contain at least one number" })
            .regex(/[@#$%^&*(){}<>?:"]/, { message: "Password must be contain at least one special character" })
    })

    const passDataWithSuccess = requiredBody.safeParse(req.body);

    if(!passDataWithSuccess.success){
        
        res.json({
            message: "incorect format",
            error: passDataWithSuccess.error
        })
        return
    }

    const { email, password, username} = req.body;
    const hashedPassword = await bcrypt.hash(password, 5);

    try {
        await UserModel.create({
            username: username,
            password: hashedPassword,
            email: email
        })

        res.json({
            message: "User signed up"
        })
    } catch (e) {
        res.status(411).json({
            message: "user allready exists"
        })
    }}
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }

})


app.post("/api/v1/signin", async ( req: Request, res: Response) => {
    
    try{
        const { username, password} = req.body;
    const validationResult = z.object({
        username: z.string().min(3).max(30),
        password: z.string()
            .regex(/[A-Z]/)
            .regex(/[a-z]/)
            .regex(/[0-9]/)
            .regex(/[@#$%^&*(){}<>?:"]/),
    })

    .safeParse(req.body);

    if (!validationResult.success) {
        res.status(400).json({
            message: "incorect format",
            error: validationResult.error
        })
    }

    const userExists = await UserModel.findOne({ username: username }).select('password');
    if (!userExists) {
        res.status(403).json({ message: "Incorrect credentials" });
        return;
    }
    const passwordMatch = await bcrypt.compare(password, userExists?.password as string)
    if (!passwordMatch){
        res.status(403).json({
            message: "Incorrect Credentials"
        })
    }

    const token = jwt.sign({
        id: userExists?._id
    }, JWT_PASSWORD as string);

    res.json({
        token
    })
    
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal server error" });
}
})


app.post("/api/v1/content", userMiddleware, async ( req: Request, res: Response) => {
    try {
    const link = req.body.link;
    const type = req.body.type;
    const tags = req.body.tags;
 
    
    await ContentModel.create({
        link,
        type,
        title: req.body.title,
        description: req.body.description,
         //@ts-ignore
        userId: req.userId,
        tags
        
       
       
    })

    res.json({
        message: "Content added"
    })
} catch (error) {
    console.error("Add content error:", error);
    res.status(500).json({ message: "Internal server error" });
}
})


app.get("/api/v1/content", userMiddleware, async ( req: Request, res: Response) => {
    try {
    //@ts-ignore
    const userId = req.userId;
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId", "username")
    res.json({
        content
    })
   } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal server error" });
}
})
app.get("/api/v1/content/displayContent/:id", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const content = await ContentModel.findOne({ _id: id });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }
        res.json({ content });
    } catch (error) {
        console.error("display error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// @ts-ignore
app.delete("/api/v1/content/:id", userMiddleware, async ( req: Request, res: Response) => {
    
try {
        const { id } = req.params;

  try {
    const result = await ContentModel.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting content', error });
  }    
    } catch (error) {
    console.error("Get Content error:", error);
    res.status(500).json({ message: "Internal server error" });
}


})
// app.get("/api/v1/contentId", userMiddleware, async (req:Request,res:Response) =>{
//     const {contentId} = req.body

//     try{
//      const  result = await ContentModel.deleteOne({
//          // @ts-ignore
//          userId: req.userId,
//          _id: contentId,
//         });

//         if(result.deletedCount === 0){
//             return res.status(404).json({
//                 message: "Content not found or you are not authorized to delete this content",
//             });
//         }   

//         console.log(contentId);
        
//     res.json({
//         message: "Content Deleted",
//     });
// } catch(e){
//     console.error('Delete content error:', e);
//     res.status(500).json({
//         message: "An error occurred while deleting the content",
//     })
// }
// })

app.post("/api/v1/brain/share", userMiddleware,async ( req: Request, res: Response): Promise<void> => {
     
    try {
    const share = req.body.share;
    //@ts-ignore
    const userId= req.userId;
        if(share){

           const existingLink = await LinkModel.findOneAndUpdate(
                {userId},
                {},
                {new: true}
            );

           if(existingLink){
           res.json({ hash: existingLink.hash });
           } 
           else{
           const hash = random(10);
           const newLink = await LinkModel.create({ userId, hash});
           res.json({ hash : newLink.hash })
           }
                

        }else{
            await LinkModel.findOneAndDelete({userId});
            res.json({ messsage: "Link Removed"});
        }

    } catch (error) {
        console.error("Sharing error:", error);
        res.status(500).json({ message: "Internal server error" });
    }

})


app.get("/api/v1/brain/:shareLink",  async ( req: Request, res: Response): Promise<void> => {
        try {
        const hash = req.params.shareLink;

        const Link = await LinkModel.findOne({
            hash
        });

        if(!Link){
            res.status(401).json({
                message: "Sorry Incorrect Input"
            })
            return;
        }
        const content = await ContentModel.find({
            userId : Link.userId
        })

        const user = await UserModel.findOne({
            _id: Link.userId
        })

        if(!user){
            res.status(411).json({
                message: "user not found, error should idealy not happen"
            })
            return;
        }

        res.json({
            
            username: user.username,
            content: content
        })

    } catch (error) {
        console.error("Share Link error:", error);
        res.status(500).json({ message: "Internal server error" });
    }

})


 app.get("/api/v1/content/type/youtube", userMiddleware, async ( req: Request, res: Response) => {
    try {
    //@ts-ignore
    const userId = req.userId;
    //  const type = req.params.type;
     
     try {
        const filteredContent = await ContentModel.find({
            userId: userId,
            type: 'youtube'
        });

        res.json({
            content: filteredContent
        });
     } catch(error){
        res.status(500).json({
            message: "Error fetching content"
            
        });
     }
    } catch (error) {
        console.error("youtube endpoint error:", error);
        res.status(500).json({ message: "Internal server error" });
    }

 });


 app.get("/api/v1/content/type/twitter", userMiddleware, async ( req: Request, res: Response) => {
    try { 
    //@ts-ignore
    const userId = req.userId;
    //  const type = req.params.type;
     
     try {
        const filteredContent = await ContentModel.find({
            userId: userId,
            type: 'twitter'
        });

        res.json({
            content: filteredContent
        });
     } catch(error){
        res.status(500).json({
            message: "Error fetching content"
            
        });
     }
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }


 });


 app.get("/api/v1/content/type/instagram", userMiddleware, async ( req: Request, res: Response) => {
    try {
    //@ts-ignore
    const userId = req.userId;
    //  const type = req.params.type;
     
     try {
        const filteredContent = await ContentModel.find({
            userId: userId,
            type: 'instagram'
        });

        res.json({
            content: filteredContent
        });
     } catch(error){
        res.status(500).json({
            message: "Error fetching content"
            
        });
     }
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }


 });


 app.get("/api/v1/content/type/facebook", userMiddleware, async ( req: Request, res: Response) => {
    try { 
    //@ts-ignore
    const userId = req.userId;
    //  const type = req.params.type;
     
     try {
        const filteredContent = await ContentModel.find({
            userId: userId,
            type: 'facebook'
        });

        res.json({
            content: filteredContent
        });
     } catch(error){
        res.status(500).json({
            message: "Error fetching content"
            
        });
     }
    } catch (error) {
        console.error("facebook error:", error);
        res.status(500).json({ message: "Internal server error" });
    }


 });

 app.get("/api/v1/content/type/pinterest", userMiddleware, async ( req: Request, res: Response) => {
    try { 
    //@ts-ignore
    const userId = req.userId;
    //  const type = req.params.type;
     
     try {
        const filteredContent = await ContentModel.find({
            userId: userId,
            type: 'pinterest'
        });

        res.json({
            content: filteredContent
        });
     } catch(error){
        res.status(500).json({
            message: "Error fetching content"
            
        });
     }
    } catch (error) {
        console.error("pinterest error:", error);
        res.status(500).json({ message: "Internal server error" });
    }


 });
 app.get("/api/v1/content/type/doc", userMiddleware, async ( req: Request, res: Response) => {
    try { 
    //@ts-ignore
    const userId = req.userId;
    //  const type = req.params.type;
     
     try {
        const filteredContent = await ContentModel.find({
            userId: userId,
            type: 'doc'
        });

        res.json({
            content: filteredContent
        });
     } catch(error){
        res.status(500).json({
            message: "Error fetching content"
            
        });
     }
    } catch (error) {
        console.error("document error:", error);
        res.status(500).json({ message: "Internal server error" });
    }


 });


 app.get("/api/v1/content/search", async (req: Request, res: Response) => {
    try{
    const { tag } = req.query; // Tag to search for

    try {
        const contents = await ContentModel.find({ tags: tag });
        res.json(contents);
    } catch (error) {
        console.error("Error searching content:", error);
        res.status(500).json({ message: "Error fetching content" });
    }
} catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
}
});


try {
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

}catch (error) {
    console.error("Server startup error:", error);
}
