import { Request, Response } from 'express'
import * as projectService from '../services/project.service'

export async function list(req: Request, res: Response) {
    const { page = '1', limit = '10', search, filters, sortField, sortOrder } = req.query
    const parsedFilters = filters ? (JSON.parse(filters as string) as Record<string, unknown>) : undefined

    const { items, total } = await projectService.listProjects({
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
    const item = await projectService.getProjectById(String(req.params.id))
    res.status(200).json(item)
}

export async function create(req: Request, res: Response) {
    const item = await projectService.createProject(req.body)
    res.status(201).json(item)
}

export async function update(req: Request, res: Response) {
    const item = await projectService.updateProject(String(req.params.id), req.body)
    res.status(200).json(item)
}

export async function remove(req: Request, res: Response) {
    const item = await projectService.deleteProject(String(req.params.id))
    res.status(200).json(item)
}

export async function metrics(req: Request, res: Response) {
    const items = await projectService.getProjectMetrics()
    res.status(200).json(items)
}

export async function options(req: Request, res: Response) {
    const { search, page = '1', limit = '20' } = req.query
    const results = await projectService.searchProjectOptions(
        search as string | undefined,
        Number(page),
        Number(limit)
    )
    res.status(200).json(results)
}

export async function optionsByIds(req: Request, res: Response) {
    const { ids } = req.body as { ids: string[] }
    const results = await projectService.getProjectsByIds(ids ?? [])
    res.status(200).json(results)
}
