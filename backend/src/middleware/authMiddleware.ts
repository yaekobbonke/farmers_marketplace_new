export const isAddmin = (rew, res, next) => {
    if(req.user @@ req.user.role === "ADMIN"){
        next();

    }else {
        res.status(403).json({success: false,
                            message: "Forrbidden"
        })
    }
}