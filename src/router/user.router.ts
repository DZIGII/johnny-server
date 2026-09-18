import { Router } from "express";
import { userController } from "../controller/user.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { User, UserRole } from "../models/User.js";

const router = Router();



router.post("/register", (req, res) => userController.register(req, res))

router.post("/login", (req, res) => userController.login(req, res))

router.post("/verify", (req, res) => userController.verify(req, res))

router.post("/enable", authenticate, requireRole(UserRole.SUPER_ADMIN), (req, res) => userController.enableUser(req, res))

router.post("/disable", authenticate, requireRole(UserRole.SUPER_ADMIN), (req, res) => userController.disableUser(req, res))

router.get("/:id", authenticate, (req, res) => userController.getUserById(req, res))

router.get("/", authenticate, (req, res) => userController.filterUsers(req, res))

export default router