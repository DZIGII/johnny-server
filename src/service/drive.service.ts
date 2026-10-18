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
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { UploadSession } from "../models/UploadSession.js";
import type { UploadChunkDto, UploadInitDto, UploadSessionDto } from "../dtos/drive.dto.js";

const STORAGE = "./storage/blobs";
const UPLOADS = "./storage/tmp/uploads";
const CHUNK_SIZE = 20 * 1024 * 1024;

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

        const hash = await this.hashFile(data.tempPath)

        return await this.saveBlob({
            tempPath: data.tempPath,
            hash,
            size: data.size,
            mime: data.mime,
            name: data.originalName,
            folderId: folder.folderId
        })
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


        async initUpload(data: UploadInitDto) {
        const user = await User.findOne({where: {email: data.userEmail}})
        if (!user) throw new Error("User not found")
        if (user?.enabled == false) throw new Error("User is disabled")

        const folder = await Folder.findByPk(data.folderId, {include: [Drive]})
        if (!folder) throw new Error("Folder not found")
        if (folder.drive.userId !== user.userId) throw new Error("Forbbiden")

        const size = Number(data.size)
        if (!Number.isInteger(size) || size <= 0) throw new Error("Invalid size")
        if (!data.name) throw new Error("Name is required")

        const session = await UploadSession.create({
            userId: user.userId,
            folderId: folder.folderId,
            name: data.name,
            mime: data.mime || "application/octet-stream",
            size,
            chunkSize: CHUNK_SIZE,
            totalChunks: Math.ceil(size / CHUNK_SIZE)
        })

        await fs.mkdir(UPLOADS, {recursive: true})
        await fs.writeFile(this.partPath(session.uploadId), "")

        return {
            uploadId: session.uploadId,
            chunkSize: session.chunkSize,
            totalChunks: session.totalChunks
        }
    }

    async uploadChunk(data: UploadChunkDto) {
        try {
            const session = await this.getSession(data.userEmail, data.uploadId)
            const index = data.index

            if (index < session.receivedChunks) return { receivedChunks: session.receivedChunks }
            if (index !== session.receivedChunks) throw new Error("Chunk out of order")

            const isLast = index === session.totalChunks - 1
            const expected = isLast
                ? Number(session.size) - index * session.chunkSize
                : session.chunkSize
            if (data.size !== expected) throw new Error("Invalid chunk size")

            const part = this.partPath(session.uploadId)
            await fs.truncate(part, index * session.chunkSize)
            await pipeline(createReadStream(data.tempPath), createWriteStream(part, {flags: "a"}))

            await session.update({receivedChunks: index + 1})
            return { receivedChunks: index + 1 }
        }
        finally {
            await fs.rm(data.tempPath, {force: true})
        }
    }

    async getUploadStatus(data: UploadSessionDto) {
        const session = await this.getSession(data.userEmail, data.uploadId)
        return {
            uploadId: session.uploadId,
            receivedChunks: session.receivedChunks,
            totalChunks: session.totalChunks,
            chunkSize: session.chunkSize
        }
    }

    async completeUpload(data: UploadSessionDto) {
        const session = await this.getSession(data.userEmail, data.uploadId)
        if (session.receivedChunks !== session.totalChunks) throw new Error("Upload incomplete")

        const part = this.partPath(session.uploadId)
        const stat = await fs.stat(part)
        if (stat.size !== Number(session.size)) throw new Error("Size mismatch")

        const hash = await this.hashFile(part)

        const file = await this.saveBlob({
            tempPath: part,
            hash,
            size: Number(session.size),
            mime: session.mime,
            name: session.name,
            folderId: session.folderId
        })

        await session.destroy()
        return file
    }

    async cancelUpload(data: UploadSessionDto) {
        const session = await this.getSession(data.userEmail, data.uploadId)
        await fs.rm(this.partPath(session.uploadId), {force: true})
        await session.destroy()
    }

    private async getSession(userEmail: string, uploadId: string) {
        const user = await User.findOne({where: {email: userEmail}})
        if (!user) throw new Error("User not found")

        const session = await UploadSession.findByPk(uploadId)
        if (!session) throw new Error("Upload not found")
        if (session.userId !== user.userId) throw new Error("Forbbiden")

        return session
    }

    private partPath(uploadId: string) {
        return path.join(UPLOADS, `${uploadId}.part`)
    }

    private async hashFile(filePath: string) {
        const hash = crypto.createHash("sha256")
        for await (const chunk of createReadStream(filePath)) {
            hash.update(chunk)
        }
        return hash.digest("hex")
    }

    private async saveBlob(data: {tempPath: string, hash: string, size: number, mime: string, name: string, folderId: string}) {
        let blob = await Blob.findByPk(data.hash)

        if (!blob) {
            let width = null;
            let height = null;

            if (data.mime.startsWith("image/")) {
                const meta = await sharp(data.tempPath).metadata()
                width = meta.width ?? null;
                height = meta.height ?? null
            }

            const dir = path.join(STORAGE, data.hash.slice(0, 2), data.hash.slice(2, 4))
            await fs.mkdir(dir, {recursive: true})
            await fs.rename(data.tempPath, path.join(dir, data.hash))

            blob = await Blob.create({
                hash: data.hash,
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
            name: data.name,
            folderId: data.folderId,
            blobHash: data.hash,
        });
    }

}


export const driveService = new DriveServie()