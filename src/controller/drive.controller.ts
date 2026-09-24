import type { Request, Response } from "express";
import { driveService } from "../service/drive.service.js";
import fs from "fs";


export class DriveController {

    async createDrive(req: Request, res: Response) {
        try {
            const response = await driveService.createDrive(req.body)
            res.status(201).json(response)
        }
        catch (e: any) {
            res.status(400).json({error: e.message})
        }
    }

    async createFolder(req: Request, res: Response) {
        try {
            const response = await driveService.createFolder(req.body)
            res.status(201).json(response)
        }
        catch (e: any) {
            res.status(400).json({error: e.message})
        }
    }

    async deleteFolder(req: Request, res: Response) {
        try {
            await driveService.deleteFolder({
                userEmail: req.body.userEmail,
                folderId: req.params.id as string
            })
            res.status(204).send()
        }
        catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    }

    async createFile(req: Request, res: Response) {
        try {
            if (!req.file) throw new Error("No file uploaded")

            const response = await driveService.createFile({
                userEmail: req.body.userEmail,
                folderId: req.body.folderId,
                originalName: req.file.originalname,
                tempPath: req.file.path,
                size: req.file.size,
                mime: req.file.mimetype
            })
            res.status(201).json(response)
        }
        catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    }

    async deleteFile(req: Request, res: Response) {
        try {
            await driveService.deleteFile({
                userEmail: req.body.userEmail,
                fileId: req.params.id as string
            })
            res.status(204).send()
        }
        catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    }

    async changeFileVisibility(req: Request, res: Response) {
        try {
            await driveService.changeFIleVisibility({
                userEmail: req.body.userEmail,
                fileId: req.params.id as string,
                visibility: req.body.visibility
            })
            res.status(200).json({ ok: true })
        }
        catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    }

    async getData(req: Request, res: Response) {
        try {
            const response = await driveService.getData({
                userEmail: req.body.userEmail,
                driveId: req.params.driveId as string,
                folderId: req.query.folderId as string | undefined
            })
            res.status(200).json(response)
        }
        catch (e: any) {
            res.status(400).json({ error: e.message })
        }
    }

    async downloadFile(req: Request, res: Response) {
        try {
            const { filePath, name, mime } = await driveService.getFileStream({
                userEmail: req.body.userEmail,
                fileId: req.params.id as string
            })

            res.setHeader("Content-Type", mime)
            res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(name)}"`)

            fs.createReadStream(filePath).pipe(res)
        }
        catch (e: any) {
            res.status(404).json({ error: e.message })
        }
    }

}