import { DecodedToken } from "./auth"; 
import { Express } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      file?: Express.Multer.File;
    }
  }
}

export {};
