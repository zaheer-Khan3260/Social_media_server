import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";


          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type : "auto"
            }
        )
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // unlink the localFilePath as tha uploading process got failed
        console.log("fail to upload the file on cloudinary reason", error);
        return null;
        
    }
}

const deleteFromCloudinary = async (productId) => {
    try {
        cloudinary.uploader.destroy(productId, function(error, result) {
            if(!result) throw new ApiError(400, error? error.message : "An error occur during delete the video")
                return true;
        })
    } catch (error) {
        console.log("Failed to delete the file reason: ",error );
        return null
    }
}

export {uploadOnCloudinary,
    deleteFromCloudinary
};