import express from 'express'
import {login} from '../controllers/authcontroller.js'
import authMiddleware from '../middlewares/authMiddleware.js'
import { verify } from '../controllers/authcontroller.js'
const router=express.Router()

router.post('/login',login)
router.get('/verify',authMiddleware,verify)

export default router