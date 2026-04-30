import express from 'express'
import { getCheckInOutList } from '../controllers/authstaff.js';
const router=express.Router()

router.get('/daily-agenda', getCheckInOutList);

export default router