import "express";

declare global {
  namespace Express {
    interface Request {
      s3Key?: string;
    }
  }
}
