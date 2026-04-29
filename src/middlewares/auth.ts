import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './AppError';
import type { JwtPayload } from '../types/auth';
import mongoose from 'mongoose';
import { base64StrToJson, calculateChecksum } from '../utils';
import { paymentTransactionRepository } from '../repository';
const ObjectId = mongoose.Types.ObjectId;

export function createAccessToken(data: JwtPayload): string {
  const options: jwt.SignOptions = { expiresIn: `${env.JWT_EXPIRE_DAYS}d` };
  return jwt.sign({ sub: data.sub, id: data.id, mobile: data.mobile }, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.id !== 'string') {
      throw new AppError('Invalid token', 401);
    }
    return { sub: payload.sub, id: new ObjectId(payload.id), mobile: payload.mobile };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
}

export function getCurrentUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ detail: 'Not authenticated' });
      return;
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 401;
    const message = error instanceof Error ? error.message : 'Not authenticated';
    res.status(statusCode).json({ detail: message });
  }
}

export const phonepeS2SCallbackAuth = async function(req: Request, res: Response, next: NextFunction){
  try{
      const receivedChecksum = req.headers['x-verify']
      if(!receivedChecksum){
          return res.status(401).send({ status: false, message: "TOKEN_NOT_FOUND"});
      }
      const payload = req.body?.response || ''
      const {data} = base64StrToJson(payload)

      const merchantId = data?.merchantId
      if(!merchantId){
          return res.status(401).send({status: false, message: "UNAUTHORIZED: merchantId is invalid"});
      }

      let saltKey = process.env.PST_PHONEPE_SALT_KEY || ''
      let saltKeyIndex = process.env.PST_SALT_KEY_INDEX || ''

      const checksum = calculateChecksum({payload, saltKey, saltKeyIndex, apiEndpoint: ''})

      if(receivedChecksum !== checksum){
          return res.status(401).send({status: false, message: "UNAUTHORIZED"});
      }
      
      const transaction = await paymentTransactionRepository.findOne({merchantTransactionId: data?.merchantTransactionId, amount: data?.amount})
      if(!transaction){
          return res.status(401).send({status: false, message: "UNAUTHORIZED"});
      }
      return next();
  }catch(exception){
      return res.status(401).send({status: false, message: "INVALID_TOKEN"});
  }
}