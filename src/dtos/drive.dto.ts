import type { EnumDataType } from "sequelize";
import type { Visibility } from "../models/Folder.js";


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