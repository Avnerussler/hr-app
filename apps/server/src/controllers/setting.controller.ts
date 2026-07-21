import { Request, Response } from 'express'
import * as settingService from '../services/setting.service'

export async function list(req: Request, res: Response) {
    const items = await settingService.listSettings()
    res.status(200).json(items)
}

export async function getById(req: Request, res: Response) {
    const item = await settingService.getSettingById(String(req.params.id))
    res.status(200).json(item)
}

export async function getByKey(req: Request, res: Response) {
    const item = await settingService.getSettingByKey(String(req.params.key))
    res.status(200).json(item)
}

export async function create(req: Request, res: Response) {
    const item = await settingService.createSetting(req.body)
    res.status(201).json(item)
}

export async function update(req: Request, res: Response) {
    const item = await settingService.updateSetting(String(req.params.id), req.body)
    res.status(200).json(item)
}

export async function remove(req: Request, res: Response) {
    const item = await settingService.deleteSetting(String(req.params.id))
    res.status(200).json(item)
}
