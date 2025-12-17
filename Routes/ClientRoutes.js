
import express from 'express'
import { verifyToken } from '../Middlewares/TokenAuth.js'
import {  PostClient } from '../Controller/Controller.js'

const router = express.Router()

router.post('/client/tokenalma',PostClient);

export default router
