import crypto from "crypto";
import path from "path";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createReadStream } from "fs";
import fs from "fs/promises";
import UploadSession from "../models/UploadSession.js";
import File from "../models/File.js";
import {
  UPLOAD_CHUNK_SIZE_BYTES,
  UPLOAD_SESSION_TTL_HOURS,
  CLOUDINARY_FOLDER,
  calculateTotalChunks,
  validateFileSize,
} from "../config/uploadConfig.js";
import {
  createSessionTempDir,
  chunkExists,
  writeChunk,
  removeSessionTempDir,
  assembleChunks,
  computeFileSha256,
  getChunkPath,
} from "../utils/chunkStorage.js";

const chunkUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, _file, cb) => {
      try {
        cb(null, req.uploadSession.tempDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, _file, cb) => {
      cb(null, `incoming-${req.body.chunkIndex}-${Date.now()}`);
    },
  }),
  limits: {
    fileSize: UPLOAD_CHUNK_SIZE_BYTES + 1024,
  },
});

// Parse multipart form fields (sessionId, chunkIndex) before loadUploadSessionForChunk
const fieldParser = multer().none();

export const chunkUploadMiddleware = [
  fieldParser,
  loadUploadSessionForChunk,
  chunkUpload.single("chunk"),
];

async function loadUploadSessionForChunk(req, res, next) {
  try {
    const { sessionId, chunkIndex } = req.body;

    if (!sessionId || chunkIndex === undefined) {
      return res.status(400).json({ error: "sessionId and chunkIndex are required" });
    }

    const parsedIndex = parseInt(chunkIndex, 10);
    if (Number.isNaN(parsedIndex) || parsedIndex < 0) {
      return res.status(400).json({ error: "Invalid chunkIndex" });
    }

    const session = await UploadSession.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: "Upload session not found" });
    }

    if (session.status === "cancelled") {
      return res.status(410).json({ error: "Upload session was cancelled" });
    }

    if (session.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Upload already completed",
        sessionId: session._id,
        fileUrl: session.fileUrl,
        uploadedBytes: session.fileSizeBytes,
        receivedChunks: session.receivedChunks,
        totalChunks: session.totalChunks,
        status: session.status,
      });
    }

    if (new Date() > session.expiresAt) {
      session.status = "failed";
      session.errorMessage = "Upload session expired";
      await session.save();
      await removeSessionTempDir(session.tempDir);
      return res.status(410).json({ error: "Upload session expired" });
    }

    if (parsedIndex >= session.totalChunks) {
      return res.status(400).json({ error: "chunkIndex exceeds total chunks" });
    }

    req.uploadSession = session;
    req.chunkIndex = parsedIndex;
    next();
  } catch (error) {
    next(error);
  }
}

export const initUpload = async (req, res) => {
  try {
    const { fileName, fileSizeBytes, mimeType, expectedChecksum, sessionId, forceUpload } = req.body;
    const userId = req.user.id;

    if (!fileName || !fileSizeBytes) {
      return res.status(400).json({ error: "fileName and fileSizeBytes are required" });
    }

    const sizeError = validateFileSize(Number(fileSizeBytes));
    if (sizeError) {
      return res.status(400).json({ error: sizeError });
    }

    if (!sessionId && expectedChecksum && !forceUpload) {
      const duplicate = await File.findOne({
        userId,
        checksum: expectedChecksum,
        isDeleted: false,
      }).select("fileUrl");

      if (duplicate) {
        return res.status(200).json({
          success: true,
          duplicateExists: true,
          existingFileUrl: duplicate.fileUrl,
        });
      }
    }

    if (sessionId) {
      const existing = await UploadSession.findOne({
        _id: sessionId,
        userId,
        status: { $in: ["pending", "uploading", "assembling"] },
      });

      if (!existing) {
        return res.status(404).json({ error: "Resumable session not found" });
      }

      if (new Date() > existing.expiresAt) {
        existing.status = "failed";
        existing.errorMessage = "Upload session expired";
        await existing.save();
        await removeSessionTempDir(existing.tempDir);
        return res.status(410).json({ error: "Upload session expired" });
      }

      return res.json({
        success: true,
        session: formatSessionResponse(existing),
      });
    }

    const uploadId = crypto.randomUUID();
    const tempDir = await createSessionTempDir(uploadId);
    const totalChunks = calculateTotalChunks(Number(fileSizeBytes));
    const expiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await UploadSession.create({
      userId,
      uploadId,
      fileName,
      mimeType: mimeType || "application/octet-stream",
      fileSizeBytes: Number(fileSizeBytes),
      totalChunks,
      chunkSizeBytes: UPLOAD_CHUNK_SIZE_BYTES,
      expectedChecksum: expectedChecksum || null,
      tempDir,
      expiresAt,
      status: "uploading",
    });

    res.status(201).json({
      success: true,
      session: formatSessionResponse(session),
    });
  } catch (error) {
    next(error);
  }
};

export const getUploadStatus = async (req, res) => {
  try {
    const session = await UploadSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: "Upload session not found" });
    }

    if (new Date() > session.expiresAt && session.status !== "completed") {
      session.status = "failed";
      session.errorMessage = "Upload session expired";
      await session.save();
      await removeSessionTempDir(session.tempDir);
      return res.status(410).json({ error: "Upload session expired" });
    }

    res.json({
      success: true,
      session: formatSessionResponse(session),
    });
  } catch (error) {
    next(error);
  }
};

export const getResumableUploads = async (req, res) => {
  try {
    const sessions = await UploadSession.find({
      userId: req.user.id,
      status: { $in: ["pending", "uploading"] },
      expiresAt: { $gt: new Date() },
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      sessions: sessions.map(formatSessionResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const uploadChunk = async (req, res) => {
  try {
    const session = req.uploadSession;
    const chunkIndex = req.chunkIndex;

    if (!req.file) {
      return res.status(400).json({ error: "No chunk data provided" });
    }

    const alreadyReceived = session.receivedChunks.includes(chunkIndex);
    let chunkSize = 0;

    if (alreadyReceived) {
      await fs.unlink(req.file.path).catch(() => {});
      const stat = await fs.stat(getChunkPath(session.tempDir, chunkIndex));
      chunkSize = stat.size;
    } else {
      chunkSize = await writeChunk(session.tempDir, chunkIndex, req.file.path);

      const expectedStart = chunkIndex * session.chunkSizeBytes;
      const expectedEnd = Math.min(
        expectedStart + session.chunkSizeBytes,
        session.fileSizeBytes,
      );
      const expectedSize = expectedEnd - expectedStart;

      if (chunkIndex < session.totalChunks - 1 && chunkSize !== session.chunkSizeBytes) {
        await fs.unlink(getChunkPath(session.tempDir, chunkIndex)).catch(() => {});
        return res.status(400).json({
          error: `Invalid chunk size. Expected ${session.chunkSizeBytes} bytes`,
        });
      }

      if (chunkIndex === session.totalChunks - 1 && chunkSize !== expectedSize) {
        await fs.unlink(getChunkPath(session.tempDir, chunkIndex)).catch(() => {});
        return res.status(400).json({
          error: `Invalid final chunk size. Expected ${expectedSize} bytes`,
        });
      }

      session.receivedChunks.push(chunkIndex);
      session.receivedChunks.sort((a, b) => a - b);
      session.uploadedBytes = Math.min(
        session.fileSizeBytes,
        session.receivedChunks.reduce((total, index) => {
          const start = index * session.chunkSizeBytes;
          const end = Math.min(start + session.chunkSizeBytes, session.fileSizeBytes);
          return total + (end - start);
        }, 0),
      );
      session.status = "uploading";
      await session.save();
    }

    const allChunksReceived = session.receivedChunks.length === session.totalChunks;

    if (allChunksReceived) {
      const result = await assembleAndUpload(session);
      return res.json({
        success: true,
        message: "Upload completed",
        session: formatSessionResponse(result),
        fileUrl: result.fileUrl,
      });
    }

    res.json({
      success: true,
      message: alreadyReceived ? "Chunk already uploaded" : "Chunk uploaded",
      session: formatSessionResponse(session),
      chunkIndex,
      chunkSize,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelUpload = async (req, res) => {
  try {
    const session = await UploadSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: "Upload session not found" });
    }

    session.status = "cancelled";
    await session.save();
    await removeSessionTempDir(session.tempDir);

    res.json({
      success: true,
      message: "Upload cancelled",
    });
  } catch (error) {
    next(error);
  }
};

async function assembleAndUpload(session) {
  if (session.status === "completed" && session.fileUrl) {
    return session;
  }

  const missingChunks = [];
  for (let i = 0; i < session.totalChunks; i++) {
    if (!(await chunkExists(session.tempDir, i))) {
      missingChunks.push(i);
    }
  }

  if (missingChunks.length > 0) {
    throw new Error(`Missing chunks: ${missingChunks.join(", ")}`);
  }

  session.status = "assembling";
  await session.save();

  const assembledPath = path.join(session.tempDir, "assembled.bin");

  try {
    await assembleChunks(session.tempDir, session.totalChunks, assembledPath);

    const assembledStat = await fs.stat(assembledPath);
    if (assembledStat.size !== session.fileSizeBytes) {
      throw new Error("Assembled file size mismatch");
    }

    if (session.expectedChecksum) {
      const actualChecksum = await computeFileSha256(assembledPath);
      if (actualChecksum !== session.expectedChecksum) {
        throw new Error("File integrity check failed: checksum mismatch");
      }
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDER,
          resource_type: "auto",
          public_id: `${session.uploadId}-${path.parse(session.fileName).name}`.slice(0, 200),
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        },
      );

      createReadStream(assembledPath).pipe(uploadStream);
    });

    session.status = "completed";
    session.fileUrl = result.secure_url;
    session.uploadedBytes = session.fileSizeBytes;
    session.errorMessage = null;
    await session.save();
    await removeSessionTempDir(session.tempDir);

    return session;
  } catch (error) {
    session.status = "failed";
    session.errorMessage = error.message;
    await session.save();
    throw error;
  }
}

function formatSessionResponse(session) {
  return {
    sessionId: session._id,
    uploadId: session.uploadId,
    fileName: session.fileName,
    mimeType: session.mimeType,
    fileSizeBytes: session.fileSizeBytes,
    totalChunks: session.totalChunks,
    chunkSizeBytes: session.chunkSizeBytes,
    receivedChunks: session.receivedChunks,
    uploadedBytes: session.uploadedBytes,
    status: session.status,
    fileUrl: session.fileUrl,
    errorMessage: session.errorMessage,
    expiresAt: session.expiresAt,
    progressPercent:
      session.fileSizeBytes > 0
        ? Math.round((session.uploadedBytes / session.fileSizeBytes) * 100)
        : 0,
  };
}

export { formatSessionResponse };
