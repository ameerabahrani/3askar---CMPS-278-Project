const User = require("../models/User");

/*
* @param {String} userId - ID of the user
* @param {Number} size - Size in bytes to add or remove, can never be  negative
* @param {String} action - "add" to increase storage, "remove" to decrease
*/



async function updateStorage(userId, size, action) {
    try {
        
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (action === "add") {
            user.storageUsed += size;
        } else if (action === "remove") {
            user.storageUsed -= size;
            if (user.storageUsed < 0) user.storageUsed = 0;
        } 
        await user.save();
    }catch (err) {
        console.error("Error updating storage:", err);
    }
}

module.exports = updateStorage;