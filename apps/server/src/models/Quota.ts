import mongoose, { Schema, Document, Model } from 'mongoose'
import { format, startOfDay } from 'date-fns'
import { FormSubmissions } from './FormSubmissions'

export interface IQuota extends Document {
    date: string
    quota: number
    notes?: string
    createdBy: string
    createdAt: Date
    updatedAt: Date

    // Virtual properties
    currentOccupancy?: number
    occupancyRate?: number
}

interface IQuotaModel extends Model<IQuota> {
    findByDateRange(startDate: string, endDate: string): Promise<IQuota[]>
    createQuotaRange(params: {
        startDate: string
        endDate?: string
        quota: number
        notes?: string
        createdBy: string
    }): Promise<IQuota[]>
    getCurrentOccupancy(date: string): Promise<number>
    getQuotaWithOccupancy(date: string): Promise<{
        quota?: number
        currentOccupancy: number
        occupancyRate?: number
    }>
    getOccupancyForDateRange(startDate: string, endDate: string): Promise<Record<string, number>>
    getQuotasWithOccupancyForRange(startDate: string, endDate: string): Promise<Array<{
        date: string
        quota?: number
        currentOccupancy: number
        occupancyRate?: number
        capacityLeft: number
        capacityLeftPercent: number
    }>>
}

const quotaSchema = new Schema<IQuota>(
    {
        date: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function (v: string) {
                    // Validate YYYY-MM-DD format
                    return /^\d{4}-\d{2}-\d{2}$/.test(v)
                },
                message: 'Date must be in YYYY-MM-DD format',
            },
        },
        quota: {
            type: Number,
            required: true,
            min: [0, 'Quota must be a positive number'],
            max: [10000, 'Quota cannot exceed 10,000'],
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
        createdBy: {
            type: String,
            required: true,
            maxlength: [100, 'Created by field cannot exceed 100 characters'],
        },
    },
    {
        timestamps: true,
        collection: 'quotas',
    }
)

// Index for efficient queries
quotaSchema.index({ date: 1 })
quotaSchema.index({ createdAt: -1 })

// Static method to find quotas by date range
quotaSchema.statics.findByDateRange = async function (
    startDate: string,
    endDate: string
): Promise<IQuota[]> {
    return this.find({
        date: {
            $gte: startDate,
            $lte: endDate,
        },
    }).sort({ date: 1 })
}

// Static method to create quota for a date range
quotaSchema.statics.createQuotaRange = async function (params: {
    startDate: string
    endDate?: string
    quota: number
    notes?: string
    createdBy: string
}): Promise<IQuota[]> {
    const { startDate, endDate, quota, notes, createdBy } = params

    // If no end date, create quota for single day
    if (!endDate) {
        const existingQuota = await this.findOne({ date: startDate })
        if (existingQuota) {
            existingQuota.quota = quota
            existingQuota.notes = notes
            existingQuota.createdBy = createdBy
            return [await existingQuota.save()]
        }

        return [
            await this.create({
                date: startDate,
                quota,
                notes,
                createdBy,
            }),
        ]
    }

    // Create quotas for date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    const quotas: IQuota[] = []

    for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
    ) {
        const dateStr = format(date, 'yyyy-MM-dd')

        // Use upsert to update existing or create new
        const quota = await this.findOneAndUpdate(
            { date: dateStr },
            {
                quota: params.quota,
                notes,
                createdBy,
                updatedAt: new Date(),
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        )

        quotas.push(quota)
    }

    return quotas
}

// Static method to get current occupancy for a date
quotaSchema.statics.getCurrentOccupancy = async function (
    date: string
): Promise<number> {
    try {
        // Query Reserve Days Management to count employees assigned to this date
        // Use imported FormSubmissions model
        
        const occupancy = await FormSubmissions.countDocuments({
            formName: 'Reserve%20Days%20Management',
            $or: [
                // Case 1: Date falls within startDate and endDate range
                {
                    'formData.startDate': { $lte: date },
                    'formData.endDate': { $gte: date }
                },
                // Case 2: Single day reservation (startDate equals the date)
                {
                    'formData.startDate': date,
                    'formData.endDate': { $exists: false }
                },
                // Case 3: startDate equals endDate equals the date
                {
                    'formData.startDate': date,
                    'formData.endDate': date
                }
            ]
        })
        
        return occupancy
    } catch (error) {
        console.error('Error calculating occupancy:', error)
        return 0
    }
}

// Static method to get quota with current occupancy
quotaSchema.statics.getQuotaWithOccupancy = async function (
    date: string
): Promise<{
    quota?: number
    currentOccupancy: number
    occupancyRate?: number
}> {
    const quotaRecord = await this.findOne({ date })
    const currentOccupancy = await (this as any).getCurrentOccupancy(date)

    const result = {
        quota: quotaRecord?.quota,
        currentOccupancy,
        occupancyRate: quotaRecord?.quota
            ? Math.round((currentOccupancy / quotaRecord.quota) * 100)
            : undefined,
    }

    return result
}

// Static method to get occupancy for a date range (more efficient for calendar views)
quotaSchema.statics.getOccupancyForDateRange = async function (
    startDate: string,
    endDate: string
): Promise<Record<string, number>> {
    try {
        // Use imported FormSubmissions model
        
        // Get all reserve days submissions that overlap with the date range
        const reservations = await FormSubmissions.find({
            formName: 'Reserve%20Days%20Management',
            $or: [
                // Reservations that start before and end within or after the range
                {
                    'formData.startDate': { $lte: endDate },
                    'formData.endDate': { $gte: startDate }
                },
                // Single day reservations within the range
                {
                    'formData.startDate': { $gte: startDate, $lte: endDate },
                    'formData.endDate': { $exists: false }
                },
                // Same day start and end within range
                {
                    'formData.startDate': { $gte: startDate, $lte: endDate },
                    'formData.endDate': { $eq: '$formData.startDate' }
                }
            ]
        }, {
            'formData.startDate': 1,
            'formData.endDate': 1,
            'formData.employeeName': 1
        })
        
        // Count occupancy for each date
        const occupancyMap: Record<string, number> = {}
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        // Initialize all dates in range with 0
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = format(date, 'yyyy-MM-dd')
            occupancyMap[dateStr] = 0
        }
        
        // Count employees for each date
        reservations.forEach((reservation: any) => {
            const resStartDate = new Date(reservation.formData.startDate)
            const resEndDate = reservation.formData.endDate 
                ? new Date(reservation.formData.endDate)
                : resStartDate // Single day if no end date
            
            // Count this employee for each day they're reserved
            const loopStart = Math.max(resStartDate.getTime(), start.getTime())
            const loopEnd = Math.min(resEndDate.getTime(), end.getTime())
            
            for (let date = new Date(loopStart); 
                 date.getTime() <= loopEnd; 
                 date.setDate(date.getDate() + 1)) {
                const dateStr = format(date, 'yyyy-MM-dd')
                if (occupancyMap[dateStr] !== undefined) {
                    occupancyMap[dateStr]++
                }
            }
        })
        
        return occupancyMap
    } catch (error) {
        console.error('Error calculating occupancy for date range:', error)
        return {}
    }
}

// Static method to get quotas with occupancy for a date range
quotaSchema.statics.getQuotasWithOccupancyForRange = async function (
    startDate: string,
    endDate: string
): Promise<Array<{
    date: string
    quota?: number
    currentOccupancy: number
    occupancyRate?: number
    capacityLeft: number
    capacityLeftPercent: number
}>> {
    try {
        // Get quotas for the date range
        const quotas = await (this as any).findByDateRange(startDate, endDate)
        const quotaMap = new Map(quotas.map((q: IQuota) => [q.date, q.quota]))
        
        // Get occupancy for the entire range efficiently
        const occupancyMap = await (this as any).getOccupancyForDateRange(startDate, endDate)
        
        // Generate result for each date in range
        const result: Array<{
            date: string
            quota?: number
            currentOccupancy: number
            occupancyRate?: number
            capacityLeft: number
            capacityLeftPercent: number
        }> = []
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        for (let date = new Date(start); date.getTime() <= end.getTime(); date.setDate(date.getDate() + 1)) {
            const dateStr = format(date, 'yyyy-MM-dd')
            const quota = quotaMap.get(dateStr)
            const currentOccupancy = occupancyMap[dateStr] || 0
            const capacityLeft = (quota && typeof quota === 'number') ? Math.max(0, quota - currentOccupancy) : 0
            const occupancyRate = (quota && typeof quota === 'number' && quota > 0) 
                ? Math.round((currentOccupancy / quota) * 100) 
                : undefined
            const capacityLeftPercent = (quota && typeof quota === 'number' && quota > 0) 
                ? Math.round((capacityLeft / quota) * 100) 
                : 0
            
            result.push({
                date: dateStr,
                quota: quota as number | undefined,
                currentOccupancy,
                occupancyRate,
                capacityLeft,
                capacityLeftPercent
            })
        }
        
        return result
    } catch (error) {
        console.error('Error getting quotas with occupancy for range:', error)
        return []
    }
}

// Virtual for current occupancy (requires population)
quotaSchema.virtual('currentOccupancy').get(function () {
    // This would be populated by a separate query or aggregation
    return 0
})

quotaSchema.virtual('occupancyRate').get(function () {
    const occupancy = this.currentOccupancy || 0
    return this.quota > 0 ? Math.round((occupancy / this.quota) * 100) : 0
})

// Ensure virtual fields are included in JSON output
quotaSchema.set('toJSON', { virtuals: true })
quotaSchema.set('toObject', { virtuals: true })

const Quota = mongoose.model<IQuota, IQuotaModel>('Quota', quotaSchema)

export default Quota
