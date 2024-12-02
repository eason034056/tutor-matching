import express from 'express'
import cors from 'cors'
import tutorsRouter from './routes/tutors'
import casesRouter from './routes/cases'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/tutors', tutorsRouter)
app.use('/api/cases', casesRouter)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
}) 