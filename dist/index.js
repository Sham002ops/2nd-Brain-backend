"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = __importDefault(require("zod"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./models/db");
const config_1 = require("./config");
const authMiddleware_1 = require("./authMiddleware");
const RandomGen_1 = require("./models/RandomGen");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
// origin: 'https://2nd-brain-vault.vercel.app', 
// methods: ['GET', 'POST', 'PUT', 'DELETE'],
// credentials: true, 
}));
app.use(express_1.default.json());
app.post("/api/v1/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is running on port ${process.env.PORT}`);
    res.json({
        message: "Server is running"
    });
}));
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // zod validation
    try {
        const requiredBody = zod_1.default.object({
            email: zod_1.default.string()
                .min(3)
                .max(30, { message: "Email should not contain more then 30 letter" }),
            password: zod_1.default.string()
                .regex(/[A-Z]/, { message: "Password must be contain at least one Capital letter" })
                .regex(/[a-z]/, { message: "Password must be contain at least one small letter" })
                .regex(/[0-9]/, { message: "Password must be contain at least one number" })
                .regex(/[@#$%^&*(){}<>?:"]/, { message: "Password must be contain at least one special character" })
        });
        const passDataWithSuccess = requiredBody.safeParse(req.body);
        if (!passDataWithSuccess.success) {
            res.json({
                message: "incorect format",
                error: passDataWithSuccess.error
            });
            return;
        }
        const { email, password, username } = req.body;
        const hashedPassword = yield bcrypt_1.default.hash(password, 5);
        try {
            yield db_1.UserModel.create({
                username: username,
                password: hashedPassword,
                email: email
            });
            res.json({
                message: "User signed up"
            });
        }
        catch (e) {
            res.status(411).json({
                message: "user allready exists"
            });
        }
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const validationResult = zod_1.default.object({
            username: zod_1.default.string().min(3).max(30),
            password: zod_1.default.string()
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
            });
        }
        const userExists = yield db_1.UserModel.findOne({ username: username }).select('password');
        if (!userExists) {
            res.status(403).json({ message: "Incorrect credentials" });
            return;
        }
        const passwordMatch = yield bcrypt_1.default.compare(password, userExists === null || userExists === void 0 ? void 0 : userExists.password);
        if (!passwordMatch) {
            res.status(403).json({
                message: "Incorrect Credentials"
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: userExists === null || userExists === void 0 ? void 0 : userExists._id
        }, config_1.JWT_PASSWORD);
        res.json({
            token
        });
    }
    catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.post("/api/v1/content", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const link = req.body.link;
        const type = req.body.type;
        const tags = req.body.tags;
        yield db_1.ContentModel.create({
            link,
            type,
            title: req.body.title,
            description: req.body.description,
            //@ts-ignore
            userId: req.userId,
            tags
        });
        res.json({
            message: "Content added"
        });
    }
    catch (error) {
        console.error("Add content error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        const content = yield db_1.ContentModel.find({
            userId: userId
        }).populate("userId", "username");
        res.json({
            content
        });
    }
    catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content/displayContent/:id", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const content = yield db_1.ContentModel.findOne({ _id: id });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }
        res.json({ content });
    }
    catch (error) {
        console.error("display error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
// @ts-ignore
app.delete("/api/v1/content/:id", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        try {
            const result = yield db_1.ContentModel.findByIdAndDelete(id);
            if (!result) {
                return res.status(404).json({ message: 'Content not found' });
            }
            res.status(200).json({ message: 'Content deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ message: 'Error deleting content', error });
        }
    }
    catch (error) {
        console.error("Get Content error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
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
app.post("/api/v1/brain/share", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const share = req.body.share;
        //@ts-ignore
        const userId = req.userId;
        if (share) {
            const existingLink = yield db_1.LinkModel.findOneAndUpdate({ userId }, {}, { new: true });
            if (existingLink) {
                res.json({ hash: existingLink.hash });
            }
            else {
                const hash = (0, RandomGen_1.random)(10);
                const newLink = yield db_1.LinkModel.create({ userId, hash });
                res.json({ hash: newLink.hash });
            }
        }
        else {
            yield db_1.LinkModel.findOneAndDelete({ userId });
            res.json({ messsage: "Link Removed" });
        }
    }
    catch (error) {
        console.error("Sharing error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hash = req.params.shareLink;
        const Link = yield db_1.LinkModel.findOne({
            hash
        });
        if (!Link) {
            res.status(401).json({
                message: "Sorry Incorrect Input"
            });
            return;
        }
        const content = yield db_1.ContentModel.find({
            userId: Link.userId
        });
        const user = yield db_1.UserModel.findOne({
            _id: Link.userId
        });
        if (!user) {
            res.status(411).json({
                message: "user not found, error should idealy not happen"
            });
            return;
        }
        res.json({
            username: user.username,
            content: content
        });
    }
    catch (error) {
        console.error("Share Link error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content/type/youtube", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        //  const type = req.params.type;
        try {
            const filteredContent = yield db_1.ContentModel.find({
                userId: userId,
                type: 'youtube'
            });
            res.json({
                content: filteredContent
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error fetching content"
            });
        }
    }
    catch (error) {
        console.error("youtube endpoint error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content/type/twitter", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        //  const type = req.params.type;
        try {
            const filteredContent = yield db_1.ContentModel.find({
                userId: userId,
                type: 'twitter'
            });
            res.json({
                content: filteredContent
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error fetching content"
            });
        }
    }
    catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content/type/instagram", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        //  const type = req.params.type;
        try {
            const filteredContent = yield db_1.ContentModel.find({
                userId: userId,
                type: 'instagram'
            });
            res.json({
                content: filteredContent
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error fetching content"
            });
        }
    }
    catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content/type/facebook", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        //  const type = req.params.type;
        try {
            const filteredContent = yield db_1.ContentModel.find({
                userId: userId,
                type: 'facebook'
            });
            res.json({
                content: filteredContent
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error fetching content"
            });
        }
    }
    catch (error) {
        console.error("facebook error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content/type/pinterest", authMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        //  const type = req.params.type;
        try {
            const filteredContent = yield db_1.ContentModel.find({
                userId: userId,
                type: 'pinterest'
            });
            res.json({
                content: filteredContent
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error fetching content"
            });
        }
    }
    catch (error) {
        console.error("facebook error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/api/v1/content/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tag } = req.query; // Tag to search for
        try {
            const contents = yield db_1.ContentModel.find({ tags: tag });
            res.json(contents);
        }
        catch (error) {
            console.error("Error searching content:", error);
            res.status(500).json({ message: "Error fetching content" });
        }
    }
    catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
try {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
catch (error) {
    console.error("Server startup error:", error);
}
