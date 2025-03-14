import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.jwt; // named the cookie jwt in the controller

  if (!token) {
    res.status(401).json({
      message: "Please log in",
    });
    return;
  }

  try {
    const decodedInfo = jwt.verify(
      token,
      `${process.env.JWT_SECRET}`
    ) as JwtPayload;

    const user = await User.findById(decodedInfo.id).select("-password");

    // @ts-ignore
    req.user = user;
    next();
  } catch (error) {
    console.log("token verification error");
    res.status(401).json({
      message: "Invalid or expired session",
    });
  }
}

export default authMiddleware;
