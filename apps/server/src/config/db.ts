import mongoose from 'mongoose'
import logger from './logger'

const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase'

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {} as mongoose.ConnectOptions)

        logger.info('MongoDB Connected 🚀')
    } catch (error) {
        logger.error('MongoDB Connection Failed:', error)
        process.exit(1) // Exit process if unable to connect
    }
}

export default connectDB
