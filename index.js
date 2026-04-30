import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import connecttodb from './config/db.js'
import roomRoutes from './routes/roomroutes.js'
import tenantRoutes from './routes/tenantroutes.js'
import paymentRoutes from './routes/paymentroutes.js'
import maintenanceRoutes from './routes/maintenanceroutes.js'
import dashboardRoutes from './routes/dashboardroutes.js'
import expenseRoutes from './routes/expensesroutes.js'
import reportRoutes from './routes/reportroutes.js'
import staffRoutes from './routes/staffroutes.js'

dotenv.config()
connecttodb()
const app=express()
app.use(cors())
app.use(express.json())


app.use('/api/auth',authRouter)
app.use('/api/rooms', roomRoutes)
app.use('/api/tenants',tenantRoutes)
app.use('/api/maintenance',maintenanceRoutes)
app.use('/api/billing',paymentRoutes)
app.use('/api/dashboard',dashboardRoutes)
app.use('/api/expenses',expenseRoutes)
app.use('/api/reports',reportRoutes)
app.use('/api/staff',staffRoutes)

const PORT=process.env.PORT||5000
app.listen(PORT,()=>{
  console.log(`Server is listening to the port ${PORT}`)  
})


