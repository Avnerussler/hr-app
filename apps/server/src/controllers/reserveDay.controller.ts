import { Request, Response } from 'express'
import * as reserveDayService from '../services/reserveDay.service'

export async function list(req: Request, res: Response) {
    const { page = '1', limit = '10', search, filters, sortField, sortOrder } = req.query
    const parsedFilters = filters ? (JSON.parse(filters as string) as Record<string, unknown>) : undefined

    const { items, total } = await reserveDayService.listReserveDays({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
        filters: parsedFilters,
        sortField: sortField as string | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    })

    const totalPages = Math.ceil(total / Number(limit)) || 1
    res.status(200).json({
        items,
        pagination: {
            page: Math.min(Number(page), totalPages),
            limit: Number(limit),
            total,
            pages: totalPages,
        },
    })
}

export async function getById(req: Request, res: Response) {
    const item = await reserveDayService.getReserveDayById(String(req.params.id))
    res.status(200).json(item)
}

export async function create(req: Request, res: Response) {
    const item = await reserveDayService.createReserveDay(req.body)
    res.status(201).json(item)
}

export async function update(req: Request, res: Response) {
    const item = await reserveDayService.updateReserveDay(String(req.params.id), req.body)
    res.status(200).json(item)
}

export async function remove(req: Request, res: Response) {
    const item = await reserveDayService.deleteReserveDay(String(req.params.id))
    res.status(200).json(item)
}

export async function metrics(req: Request, res: Response) {
    const items = await reserveDayService.getReserveDayMetrics()
    res.status(200).json(items)
}

export async function updateAttendance(req: Request, res: Response) {
    const { employeeId, date, hasAttended } = req.body as {
        employeeId: string
        date: string
        hasAttended: boolean
    }
    const items = await reserveDayService.updateAttendance(employeeId, date, hasAttended)
    res.status(200).json({ items })
}
