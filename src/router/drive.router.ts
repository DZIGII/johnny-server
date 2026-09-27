import { Router } from "express";
import multer from "multer";
import { driveController } from "../controller/drive.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const upload = multer({ dest: "storage/tmp" });
const router = Router();

router.post("/", authenticate, (req, res) => driveController.createDrive(req, res));
router.get("/gallery", authenticate, (req, res) => driveController.getImagesAndVideos(req, res));

router.post("/folders", authenticate, (req, res) => driveController.createFolder(req, res));
router.delete("/folders/:id", authenticate, (req, res) => driveController.deleteFolder(req, res));

router.post("/files", authenticate, upload.single("file"), (req, res) => driveController.createFile(req, res));
router.delete("/files/:id", authenticate, (req, res) => driveController.deleteFile(req, res));
router.patch("/files/:id/visibility", authenticate, (req, res) => driveController.changeFileVisibility(req, res));


router.get("/files/:id/download", optionalAuth, (req, res) => driveController.downloadFile(req, res));

router.get("/:driveId", authenticate, (req, res) => driveController.getData(req, res));

export default router