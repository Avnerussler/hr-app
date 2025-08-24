import mongoose, { Schema, Document, Types } from 'mongoose'
import { getWeek, getYear, startOfWeek, endOfWeek, addDays } from 'date-fns'

export interface IWorkHours extends Document {
    employeeId: Types.ObjectId
    employeeName: string
    projectId?: Types.ObjectId
    projectName?: string
    date: Date
    hours: number
    notes?: string
    status: 'draft' | 'submitted' | 'approved' | 'rejected'
    submittedBy: Types.ObjectId
    submittedAt?: Date
    approvedBy?: Types.ObjectId
    approvedAt?: Date
    createdAt: Date
    updatedAt: Date
    weekNumber: number
    yearWeek: string
    submit(): Promise<IWorkHours>
    approve(approvedById: Types.ObjectId): Promise<IWorkHours>
    reject(): Promise<IWorkHours>
}

export interface IWorkHoursModel extends mongoose.Model<IWorkHours> {
    findByEmployeeAndDateRange(
        employeeId: Types.ObjectId,
        startDate: Date,
        endDate: Date
    ): mongoose.Query<IWorkHours[], IWorkHours>
    
    findByWeek(
        year: number,
        week: number
    ): mongoose.Query<IWorkHours[], IWorkHours>
    
    getWeeklyMetrics(
        startDate: Date,
        endDate: Date
    ): mongoose.Aggregate<any[]>
}

const WorkHoursSchema: Schema = new Schema(
    {
        // Employee reference
        employeeId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'form_submissions',
            index: true
        },
        employeeName: {
            type: String,
            required: true
        },

        // Project reference (optional)
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'form_submissions',
            index: true
        },
        projectName: {
            type: String
        },

        // Work details
        date: {
            type: Date,
            required: true,
            index: true
        },
        hours: {
            type: Number,
            required: true,
            min: 0,
            max: 24,
            validate: {
                validator: function(value: number) {
                    return value >= 0 && value <= 24
                },
                message: 'Hours must be between 0 and 24'
            }
        },
        notes: {
            type: String,
            maxlength: 500
        },

        // Workflow status
        status: {
            type: String,
            enum: ['draft', 'submitted', 'approved', 'rejected'],
            default: 'draft',
            index: true
        },

        // Audit trail
        submittedBy: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'form_submissions' // Assuming user management through form submissions
        },
        submittedAt: {
            type: Date
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'form_submissions'
        },
        approvedAt: {
            type: Date
        }
    },
    { 
        timestamps: true,
        collection: 'work_hours'
    }
)

// Compound indexes for efficient queries
WorkHoursSchema.index({ employeeId: 1, date: 1 }, { unique: true }) // Prevent duplicate entries per employee per day
WorkHoursSchema.index({ date: 1, status: 1 }) // For date range and status queries
WorkHoursSchema.index({ employeeId: 1, date: -1 }) // For employee time tracking history
WorkHoursSchema.index({ projectId: 1, date: 1 }) // For project time tracking
WorkHoursSchema.index({ submittedBy: 1, createdAt: -1 }) // For manager's submitted entries

// Virtual for week number using date-fns
WorkHoursSchema.virtual('weekNumber').get(function(this: IWorkHours) {
    return getWeek(this.date, { weekStartsOn: 1 }) // Monday as first day
})

// Virtual for year-week identifier
WorkHoursSchema.virtual('yearWeek').get(function(this: IWorkHours) {
    const year = getYear(this.date)
    const weekNum = getWeek(this.date, { weekStartsOn: 1 })
    return `${year}-W${weekNum.toString().padStart(2, '0')}`
})

// Static methods for common queries
WorkHoursSchema.statics.findByEmployeeAndDateRange = function(
    employeeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
) {
    return this.find({
        employeeId,
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ date: 1 })
}

WorkHoursSchema.statics.findByWeek = function(
    year: number,
    week: number
) {
    // Create a date in the given year and week using date-fns
    const januaryFirst = new Date(year, 0, 1)
    const firstWeekStart = startOfWeek(januaryFirst, { weekStartsOn: 1 })
    
    // Calculate the start of the target week
    const weekStart = addDays(firstWeekStart, (week - 1) * 7)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    
    return this.find({
        date: {
            $gte: weekStart,
            $lte: weekEnd
        }
    }).sort({ employeeName: 1, date: 1 })
}

WorkHoursSchema.statics.getWeeklyMetrics = function(
    startDate: Date,
    endDate: Date
) {
    return this.aggregate([
        {
            $match: {
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: null,
                totalHours: { $sum: '$hours' },
                uniqueEmployees: { $addToSet: '$employeeId' },
                entries: { $sum: 1 },
                avgHoursPerDay: { $avg: '$hours' }
            }
        },
        {
            $project: {
                _id: 0,
                totalHours: 1,
                activeEmployees: { $size: '$uniqueEmployees' },
                totalEntries: '$entries',
                avgHoursPerDay: { $round: ['$avgHoursPerDay', 2] },
                avgHoursPerEmployee: {
                    $round: [
                        { $divide: ['$totalHours', { $size: '$uniqueEmployees' }] },
                        2
                    ]
                }
            }
        }
    ])
}

// Instance methods
WorkHoursSchema.methods.submit = function(this: IWorkHours) {
    this.status = 'submitted'
    this.submittedAt = new Date()
    return this.save()
}

WorkHoursSchema.methods.approve = function(this: IWorkHours, approvedById: Types.ObjectId) {
    this.status = 'approved'
    this.approvedBy = approvedById
    this.approvedAt = new Date()
    return this.save()
}

WorkHoursSchema.methods.reject = function(this: IWorkHours) {
    this.status = 'rejected'
    return this.save()
}

export const WorkHours = mongoose.model<IWorkHours, IWorkHoursModel>('work_hours', WorkHoursSchema)