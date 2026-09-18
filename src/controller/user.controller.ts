import type { Request, Response } from "express";
import { userService } from "../service/user.service.js";


class UserController {

    async register(req: Request, res: Response) {
        try {
            const result = await userService.register(req.body)
            return res.status(201).json(result)
        }
        catch (e: any) {
            return res.status(400).json({error: e.message})
        }
    }

    async login(req: Request, res: Response) {
        try {
            const result = await userService.login(req.body)
            res.status(200).json(result)
        }
        catch (e: any) {
            res.status(400).json({error: e.message})
        }
    }

    async verify(req: Request, res: Response) {
        try {
            const user = await userService.verify(req.body.email, req.body.code)
            res.status(200).json(user) 
        }
        catch (e: any) {
            res.status(400).json({error: e.message})
        }     
    }

    async enableUser(req: Request, res: Response) {
        try {
            const result = await userService.enableUser(req.body)
            res.status(200).json("Succses enabled")
        }
        catch (e: any) {
            res.status(400).json({error: e.message})
        }
    }

    async disableUser(req: Request, res: Response) {
        try {
            const result = await userService.disableUser(req.body)
            res.status(200).json("Succses disabled " + result)
        }
        catch (e: any) {
            res.status(400).json({error: e.message})
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const user = await userService.getUserById(req.params.id)
            res.status(200).json(user)
        }
        catch(e: any) {
            res.status(404).json({error: e.message})
        }
    }

    async filterUsers(req: Request, res: Response) {
        try {

            const result = await userService.filterUser({
                search: (req.query.search as string) || "",
                sort: (req.query.sort as string) || "asc",
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20
            });

            res.status(200).json(result)

        }
        catch (e: any) {
            res.status(400).json({error: e.message})
        }
    }

}

export const userController = new UserController()