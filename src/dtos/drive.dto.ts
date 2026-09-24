import type { EnumDataType } from "sequelize";
import type { Folder, Visibility } from "../models/Folder.js";
import type { File } from "../models/File.js"


export interface DriveCreateDto {
    name: string;
    userEmail: string;
}

export interface FolderCreateDto {
    userEmail: string;
    name: string;
    parentId: string | null;
    driveId: string | null;
}

export interface DeleteFolderDto {
    userEmail: string;
    folderId: string;
}

export interface FileCreateDto {
  userEmail: string;
  folderId: string;
  originalName: string;
  tempPath: string;
  size: number;
  mime: string;
}

export interface DeleteFileDto {
    userEmail: string;
    fileId: string;
}



export interface VisibilityFileDto {
    userEmail: string;
    fileId: string;
    visibility: Visibility;
}

export interface GetDataDto {
    userEmail: string;
    folderId?: string;
    driveId: string;
}

export interface FileResponseDto {
    fileId: string;
    name: string;
    visibility: string;
    mime: string;
    size: number;
}

export interface FolderResponseDto {
    folderId: string;
    name: string;
    parentId: string | null;
    children: FolderResponseDto[];
    files: FileResponseDto[];
}

export function toFileResponse(file: File): FileResponseDto {
    return {
        fileId: file.fileId,
        name: file.name,
        visibility: file.visibility,
        mime: file.blob?.mime ?? "",
        size: Number(file.blob?.size ?? 0),
    };
}

export function toFolderResponse(folder: Folder): FolderResponseDto {
    return {
        folderId: folder.folderId,
        name: folder.name,
        parentId: folder.parentId,
        children: (folder.children ?? []).map(c => ({
            folderId: c.folderId,
            name: c.name,
            parentId: c.parentId,
            children: [],
            files: [],
        })),
        files: (folder.files ?? []).map(toFileResponse),
    };
}