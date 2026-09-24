import type { DeleteFileDto, DeleteFolderDto, DriveCreateDto, FileCreateDto, FolderCreateDto, GetDataDto, VisibilityFileDto } from "../dtos/drive.dto.js";
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
        
        if (foler.drive.userId !== user.userId) throw new Error("Forbbiden")

        await foler.destroy()
    }

    async createFile(data: FileCreateDto) {
        const user = await User.findOne({where: {email: data.userEmail}})

        if (!user) throw new Error("User not found")
        
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
        
        const file = await File.findByPk(data.fileId, {
            include: [{model: Folder, include: [Drive]}]
        })
        if (!file) throw new Error("File not found")
        
        if (file.folder.drive.userId != user.userId) throw new Error("Forbbiden")
        
        await file.update({visibility: data.visibility})
    }

    async getData(data: GetDataDto) {
        const user = await User.findOne({where: {email: data.userEmail}})
        if (!user) throw new Error("User not found")
        
        const drive = await Drive.findByPk(data.driveId, {
            include: [{model: Folder}]
        })
        if (!drive) throw new Error("Drive not found")
        
        if (user.drive.driveId !== drive.driveId) throw new Error("Forbbiden")
        
        const folder = await Folder.findByPk(data.folderId, {
            include: [
                { model: Folder, as: "children" },
                { model: File, include: [Blob] }
            ]
        });

        if (!folder) return drive;

        return folder
        
    }

}