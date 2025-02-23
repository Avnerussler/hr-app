import mongoose from 'mongoose'

const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase'

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {} as mongoose.ConnectOptions)

        console.log('MongoDB Connected 🚀')
    } catch (error) {
        console.error('MongoDB Connection Failed:', error)
        process.exit(1) // Exit process if unable to connect
    }
}

export default connectDB
