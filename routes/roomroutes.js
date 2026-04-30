import express from 'express'
import { createRoom,getRooms,deleteRoom,updateRoom} from '../controllers/authrooms.js'
import { availableRoom } from '../controllers/authtenants.js'
import authMiddleware from '../middlewares/authMiddleware.js'
const router=express.Router()

router.post('/createdroom',authMiddleware,createRoom)
router.get('/getrooms',getRooms)
router.delete('/delete/:id',authMiddleware,deleteRoom)
router.put('/update/:id',authMiddleware,updateRoom)

router.get('/available',availableRoom )

export default router