import { Router } from "express";
import multer from "multer";
import { driveController } from "../controller/drive.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const upload = multer({ dest: "storage/tmp" });
const chunkUpload = multer({ dest: "storage/tmp", limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

router.post("/", authenticate, (req, res) => driveController.createDrive(req, res));
router.get("/gallery", authenticate, (req, res) => driveController.getImagesAndVideos(req, res));

router.post("/folders", authenticate, (req, res) => driveController.createFolder(req, res));
router.delete("/folders/:id", authenticate, (req, res) => driveController.deleteFolder(req, res));

router.post("/files", authenticate, upload.single("file"), (req, res) => driveController.createFile(req, res));
router.delete("/files/:id", authenticate, (req, res) => driveController.deleteFile(req, res));
router.patch("/files/:id/visibility", authenticate, (req, res) => driveController.changeFileVisibility(req, res));


router.get("/files/:id/download", optionalAuth, (req, res) => driveController.downloadFile(req, res));

router.get("/me", authenticate, (req, res) => driveController.getMyDrive(req, res));

router.get("/folders/:folderId", authenticate, (req, res) => driveController.getFolder(req, res));

router.post("/uploads", authenticate, (req, res) => driveController.initUpload(req, res));
router.get("/uploads/:id", authenticate, (req, res) => driveController.getUploadStatus(req, res));
router.put("/uploads/:id/chunks/:index", authenticate, chunkUpload.single("chunk"), (req, res) => driveController.uploadChunk(req, res));
router.post("/uploads/:id/complete", authenticate, (req, res) => driveController.completeUpload(req, res));
router.delete("/uploads/:id", authenticate, (req, res) => driveController.cancelUpload(req, res));

export default router