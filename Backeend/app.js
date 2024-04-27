import dotenv from 'dotenv'

import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import passport from "passport";
import { User} from "./models/user.models.js";
import session from "express-session";

dotenv.config();
const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(session({
    secret: process.env.SECRETE_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// import router
import userRoute from './routers/user.routes.js'


app.use("/api/v1/user", userRoute)


export {app}