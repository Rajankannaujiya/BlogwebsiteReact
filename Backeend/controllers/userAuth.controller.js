
import asyncHandlerr from "express-async-handler";
import { User } from "../models/user.models.js";
import passport from "passport";
import { uploadOnCloudinary } from '../utilits/cloudinary.js'


const registrationFuction = asyncHandlerr(async (req, res) => {
  const {username, email, password } = req.body; 
  console.log(req.body)

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    fs.unlinkSync(path.resolve(avatarLocalPath))
    return res.status(401).send('user with the given username or email already exists');
  }

  
  const avatarLocalPath = await req.files?.avatar?.[0]?.path;
  console.log("avatar is", avatarLocalPath)
  if(!avatarLocalPath){
    return res.status(401).send('Avatar image is required');
  }


  try {
    var avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log(avatar)
  } catch (error) {
      console.error("Error while uploading image :: ", error?.message);
      res.status(401).send('An error has been occur while uploading the file')
  }


  const user = {
    username: username.toLowerCase(),
    avatar:{publicId:avatar?.public_id, url:avatar?.url},
    email: email,
  };

  User.register(new User(user), req.body.password, function (err, user) {
    if (err) {
      console.log(err)
      return res
        .status(401)
        .send({
          info: "Sorry. That username already exists. Try again.",
        });
    } else {
      passport.authenticate("local")(req, res, function () {
        return res
          .status(200)
          .send({ message: "successful registration", user: req.user });
      });
    }
  });
});

const loginFunction = asyncHandlerr(async (req, res) => {
    const {username,password } = req.body;

    if (!username|| !password) {
        return res.status(400).send({ message: "Email and password are required" });
    }

    const user = new User({
        username:username,
        password: password
    });
    console.log(user)

    req.login(user, function (err,next) {
        if (err) {
            console.error(err);
            next(err);
            return res.status(500).send({ message: "Internal server error" });
        }

        
        passport.authenticate("local")(req, res, function () {
            res.status(200).send({ message: "Successful login" ,user:req.user});
        });
    });

});


const logoutFunction= asyncHandlerr(async(req,res,next)=>{
  req.logout (function(err) {
    if (err) 
    { 
      return next(err); 
    }
    return res.status(200).send({message: "logout successfull"});
  })
})


const changePassword=asyncHandlerr(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;

  const user= await User.findById(req.user?._id);
  if(!user){
    throw new Error("user not found")
  }

    user.changePassword(oldPassword,newPassword)
    user.save();

    return res.status(200).json({message:"password change successfully"});
})


const changeUserDetails=asyncHandlerr(async(req,res)=>{
  const {username,email}=req.body;

  if(!username || !email){
    throw new Error("username or email is requied");
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set: {
            fullName,
            email: email
        }
    },
    {new: true}
  ).select("-password")


  return res.status(200).json({message: "user details saved successfully"});
})


const updateUserAvatar = asyncHandlerr(async(req, res)=>{
  const avatarLocalPath = req.file?.path


  if(!avatarLocalPath){
    throw new Error("avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  
  if(!avatar){
    throw new Error("An error has been occur while updating the avatar")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
        {
            $set:{
                avatar: {
                  publicId: avatar?.public_id,
                  url: avatar?.url
                }
            }
        },
        {new: true}
    ).select("-password")

  return res.status(200).json({message: "avatar set successfully"});

});



const getWatchHistory = asyncHandlerr(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      {
      history:user[0].watchHistory,
      message:"watch history fetched successfully"
    }
  )
})



export {
  registrationFuction,
  loginFunction,
  logoutFunction,
  changePassword,
  changeUserDetails,
  updateUserAvatar,
  getWatchHistory
};


