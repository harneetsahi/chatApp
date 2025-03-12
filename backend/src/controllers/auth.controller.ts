import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

export const signup = async (req: Request, res: Response) => {
  const requiredBody = z.object({
    firstName: z.string().min(3).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(16)
      .refine(
        (value) =>
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\d\s]).+$/.test(value),
        {
          message:
            "Password must be atleast 8 characters long with max 15 characters and have at least one uppercase letter, one lowercase letter, one special character, and one number",
        }
      ),
  });

  const parsedBody = requiredBody.safeParse(req.body);
  if (!parsedBody.success) {
    return res.json({
      message: "Incorrect format",
      error: parsedBody.error,
    });
  }

  ////!SECTION
  const { firstName, lastName, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 8);

    console.log(firstName, lastName, email, password);

    await User.create({ firstName, lastName, email, password: hashedPassword });

    res.json({
      message: "successfully signed up",
    });
  } catch (error) {
    res.status(400).json({
      message: "User already exists",
    });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user) {
      const matchPassword = await bcrypt.compare(password, user.password);

      if (matchPassword) {
        const token = jwt.sign(
          {
            id: user._id,
          },
          `${process.env.JWT_SECRET}`,
          { expiresIn: "7d" }
        );

        const options = {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
        };

        return res
          .status(201)
          .cookie("jwt", token, options)
          .json({ message: "logged in successfully" });
      } else {
        return res.json({ message: "Incorrect credentials" });
      }
    } else {
      return res.json({
        message: "User does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const signout = (req: Request, res: Response) => {};
