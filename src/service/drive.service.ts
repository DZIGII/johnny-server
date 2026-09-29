import { toFileResponse, toFolderResponse, type DeleteFileDto, type DeleteFolderDto, type DriveCreateDto, type FileCreateDto, type FolderCreateDto, type GetDataDto, type VisibilityFileDto } from "../dtos/drive.dto.js";
import type { UserDto } from "../dtos/user.dto.js";
import { Drive } from "../models/Drive.js";
import { Folder, Visibility } from "../models/Folder.js";
import { User } from "../models/User.js";
import { Blob } from "../models/Blob.js";
import { File } from "../models/File.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { Op } from "sequelize";

const STORAGE = "./storage/blobs";

export class DriveServie {

    async createDrive(drive: DriveCreateDto) {
        const result = await User.findOne({
            where: {email : drive.userEmail}
        })

        if (result?.enabled == false) throw new Error("User is disabled")
        if (result?.emailVerified == false) throw new Error("Email not verified")
        if (!result) throw new Error("User not found")

        const existing = await Drive.findOne({ where: { userId: result.userId } });
        if (existing) throw new Error("User already has drive");

        const res = await Drive.create({
            name: drive.name,
            userId: result.userId
        })
        
        return res;
    }

    async createFolder(folder: FolderCreateDto) {
        const user = await User.findOne({
            where: {email: folder.userEmail}
        })

        if (!user) throw new Error("User not found")
        if (user?.enabled == false) throw new Error("User is disabled")
        if (user?.emailVerified == false) throw new Error("Email not verified")

        const drive = await Drive.findOne({
            where: {userId: user.userId}
        })

        if (!drive) throw new Error("Create drive first")

        return await Folder.create({
            name: folder.name,
            parentId: folder.parentId,
            driveId: drive?.driveId
        })
    }

    async deleteFolder(data: DeleteFolderDto) {
        const user = await User.findOne({
            where: {email: data.userEmail}
        })

        if (!user) throw new Error("User not found")
        
        const foler = await Folder.findByPk(data.folderId, {
            include: [Drive]
        })

        if (!foler) throw new Error("Folder not found")
        if (user?.enabled == false) throw new Error("User is disabled")

        if (foler.drive.userId !== user.userId) throw new Error("Forbbiden")

        await foler.destroy()
    }

    async createFile(data: FileCreateDto) {
        const user = await User.findOne({where: {email: data.userEmail}})

        if (!user) throw new Error("User not found")
        
        if (user?.enabled == false) throw new Error("User is disabled")


        const folder = await Folder.findByPk(data.folderId, {include:[Drive]})
        if (!folder) throw new Error("Folder not found")
        if (folder.drive.userId !== user.userId) throw new Error("Forbbiden")

        const buffer = await fs.readFile(data.tempPath)
        const hash = crypto.createHash("sha256").update(buffer).digest("hex")

        let blob = await Blob.findByPk(hash)

        if (!blob) {
            let width = null;
            let height = null;

            if (data.mime.startsWith("image/")) {
                const meta = await sharp(buffer).metadata()
                width = meta.width ?? null;
                height = meta.height ?? null
            }

            const dir = path.join(STORAGE, hash.slice(0, 2), hash.slice(2, 4))
            await fs.mkdir(dir, {recursive: true})
            await fs.rename(data.tempPath, path.join(dir, hash))
            

            blob = await Blob.create({
                hash,
                size: data.size,
                mime: data.mime,
                width,
                height,
            });
        }
        else {
            await fs.unlink(data.tempPath)
        }
        
        return await File.create({
            name: data.originalName,
            folderId: folder.folderId,
            blobHash: hash,
        });
    }

    async deleteFile(data: DeleteFileDto) {
        const user = await User.findOne({ where:{email: data.userEmail}})

        if (!user) throw new Error("User not found")
        if (user?.enabled == false) throw new Error("User is disabled")

        
        const file = await File.findByPk(data.fileId, {
            include: [{model: Folder, include: [Drive]}]
        })

        if (!file) throw new Error("File not found")
        if (file.folder.drive.userId !== user.userId) throw new Error("Forbbiden")

        await file.destroy()
    }

    async changeFIleVisibility(data: VisibilityFileDto) {
        const user = await User.findOne({where: {email: data.userEmail}})
        if (!user) throw new Error("User not found")
        
        if (user?.enabled == false) throw new Error("User is disabled")


        const file = await File.findByPk(data.fileId, {
            include: [{model: Folder, include: [Drive]}]
        })
        if (!file) throw new Error("File not found")
        
        if (file.folder.drive.userId != user.userId) throw new Error("Forbbiden")
        
        await file.update({visibility: data.visibility})
    }

    async getMyDrive(userEmail: string) {
        const user = await User.findOne({ where: { email: userEmail } })
        if (!user) throw new Error("User not found")

        const drive = await Drive.findOne({ where: { userId: user.userId } })
        if (!drive) throw new Error("No drive")

        const roots = await Folder.findAll({
            where: { driveId: drive.driveId, parentId: null }
        })

        return {
            driveId: drive.driveId,
            name: drive.name,
            folders: roots.map(f => ({ folderId: f.folderId, name: f.name })),
        }
    }

    async getFolder(userEmail: string, folderId: string) {
        const user = await User.findOne({ where: { email: userEmail } })
        if (!user) throw new Error("User not found")

        const folder = await Folder.findByPk(folderId, {
            include: [
                Drive,
                { model: Folder, as: "children" },
                { model: File, include: [Blob] }
            ]
        })

        if (!folder) throw new Error("Folder not found")
        if (folder.drive.userId !== user.userId) throw new Error("Forbidden")

        return toFolderResponse(folder)
    }


    async getFileStream(data: {userEmail?: string, fileId: string}) {
        const file = await File.findByPk(data.fileId, {
            include: [Blob, {model: Folder, include: [Drive]}]
        })

        if (!file) throw new Error("File not found")
        if (file.visibility !== Visibility.PUBLIC) {
            if (!data.userEmail) throw new Error("Forbbiden")
            const user = await User.findOne({where: {email: data.userEmail}})
            if (!user || file.folder.drive.userId !== user.userId) throw new Error("Forbbiden")
        }

        const hash = file.blobHash
        return {
            filePath: path.join(STORAGE, hash.slice(0, 2), hash.slice(2, 4), hash),
            name: file.name,
            mime: file.blob.mime
        }

    }


    async getImagesAndVideos(data: {userEmail: string, before?: string, limit?: number}) {
        const user = await User.findOne({where: {email: data.userEmail}})
        if (!user) throw new Error("User not found")

        if (user?.enabled == false) throw new Error("User is disabled")


        const drive = await Drive.findOne({where: {userId: user.userId}})
        if (!drive) throw new Error("Drive not found")
        
        const blobWhere: any = {
            mime: { [Op.or]: [{ [Op.like]: 'image/%' }, { [Op.like]: 'video/%' }] }
        }

        if (data.before) {
            blobWhere.capturedAt = { [Op.lt]: new Date(data.before) }
        }

        const files = await File.findAll({
            include: [
                { model: Blob, where: blobWhere },
                { model: Folder, where: { driveId: drive.driveId } }
            ],
            order: [[{ model: Blob, as: 'blob' }, 'capturedAt', 'DESC']],
            limit: data.limit ?? 50
        })

        return files.map(toFileResponse)
    }

}

export const driveService = new DriveServie()