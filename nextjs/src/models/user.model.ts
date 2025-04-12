import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Please provide a username"],
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: [6, "Password must be atleast 6 characters"],
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
