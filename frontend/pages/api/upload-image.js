import formidable from "formidable";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(process.cwd(), "public", "uploads");
    form.keepExtensions = true;

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(form.uploadDir)) {
      fs.mkdirSync(form.uploadDir, { recursive: true });
    }

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.image;
    const fileExt = path.extname(file.originalFilename);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(form.uploadDir, fileName);

    // Move file to permanent location
    fs.renameSync(file.filepath, filePath);

    // Return the URL of the uploaded image
    const imageUrl = `/uploads/${fileName}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
}
