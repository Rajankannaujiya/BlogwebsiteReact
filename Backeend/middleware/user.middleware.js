import { User } from "../models/user.models.js";
import asyncHandler from "express-async-handler";

const userMiddleware = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      throw new Error(401, "user is not sent in the params");
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      throw new Error(400, "user is not found");
    }

    req.user = existingUser;
    return next();
  } catch (error) {
    throw new Error(401, error?.message || "internal server error");
  }
});

export default userMiddleware;
