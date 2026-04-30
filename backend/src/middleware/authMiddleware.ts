export const isAdmin = (req: any, res: any, next: any) => {
    if(req.user && req.user.role === "ADMIN"){
        next();
    } else {
        res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }
}