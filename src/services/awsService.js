import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
});
const timestamp = Date.now();

const uploadArtistAvatar = async (artistId, file) => {
    const fileName = `PBL6/ARTIST/ARTIST_${artistId}/avatar_${timestamp}`;
    const buffer = await sharp(file.buffer).resize({ width: 320, height: 320, fit: 'fill' }).toBuffer();
    const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Đặt quyền truy cập công khai
    };

    const data = await s3.upload(params).promise();
    return data.Location;
};

const uploadPlaylistAvatar = async (userId, playlistId, file) => {
    console.log('upload playlist', file);
    const fileName = `PBL6/USER/${userId}/PLAYLIST/${playlistId}/${file.originalname}`;
    const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read', // Đặt quyền truy cập công khai
    };

    const data = await s3.upload(params).promise();
    return data.Location;
};

const uploadSongWithLyric = async (songId, file, lyric) => {
    console.log('upload song', file);
    const fileName = `PBL6/SONG/${songId}/${file.originalname}`;
    const fileNameLyric = `PBL6/LYRIC/${songId}/${lyric.originalname}`;

    const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read', // Đặt quyền truy cập công khai
    };

    const paramsLyric = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileNameLyric,
        Body: lyric.buffer,
        ACL: 'public-read', // Đặt quyền truy cập công khai
        ContentType: 'application/json',
    };

    const [data, dataLyric] = await Promise.all([s3.upload(params).promise(), s3.upload(paramsLyric).promise()]);
    return {
        filePathAudio: data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        ),
        filePathLyric: dataLyric.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        ),
    };
};

const uploadSong = async (songId, file) => {
    try {
        console.log('upload song', file);
        const fileExtension = path.extname(file.originalname);
        const fileName = `PBL6/SONG/SONG_${songId}/audio/audio${fileExtension}`;

        const params = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ACL: 'public-read', // Đặt quyền truy cập công khai
        };

        const data = await s3.upload(params).promise();

        return data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        );
    } catch (error) {
        throw error;
    }
};

const uploadSongLyric = async (songId, lyric) => {
    try {
        const fileExtension = path.extname(lyric.originalname);
        const fileName = `PBL6/SONG/SONG_${songId}/lyric/lyric${fileExtension}`;

        const params = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: fileName,
            Body: lyric.buffer,
            ACL: 'public-read', // Đặt quyền truy cập công khai
            ContentType: 'application/json',
        };

        const data = await s3.upload(params).promise();

        return data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        );
    } catch (error) {
        throw error;
    }
};

const uploadLyricFile = async (songId, lyric) => {
    try {
        console.log('upload lyric file', lyric);
        const fileName = `PBL6/LYRIC/${songId}/lyric_${lyric.originalname}`;
        const params = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: fileName,
            Body: lyric.buffer,
            ACL: 'public-read', // Đặt quyền truy cập công khai
            ContentType: 'application/json',
        };

        const data = await s3.upload(params).promise();
        return data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        );
    } catch (error) {
        throw error;
    }
};

const uploadAlbumCover = async (mainArtistId, albumId, file) => {
    console.log('upload album cover', file);
    const fileName = `PBL6/ALBUM/${albumId}/${file.originalname}`;
    const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read', // Đặt quyền truy cập công khai
    };

    const data = await s3.upload(params).promise();
    return data.Location;
};

// personal song
const userUploadSong = async (userId, songId, file) => {
    try {
        const fileExtension = path.extname(file.originalname);
        const fileName = `PBL6/USER/USER_${userId}/SONG_${songId}/audio/audio${fileExtension}`;

        const params = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ACL: 'public-read', // Đặt quyền truy cập công khai
        };

        const data = await s3.upload(params).promise();

        return data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        );
    } catch (error) {
        throw error;
    }
};

const userUploadSongLyric = async (userId, songId, lyric) => {
    try {
        const fileExtension = path.extname(lyric.originalname);
        const fileName = `PBL6/USER/USER_${userId}/SONG_${songId}/lyric/lyric${fileExtension}`;

        const params = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: fileName,
            Body: lyric.buffer,
            ACL: 'public-read', // Đặt quyền truy cập công khai
            ContentType: 'application/json',
        };

        const data = await s3.upload(params).promise();

        return data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        );
    } catch (error) {
        throw error;
    }
};

const userUploadSongImage = async (userId, songId, image) => {
    try {
        const fileExtension = path.extname(image.originalname);
        const fileName = `PBL6/USER/USER_${userId}/SONG_${songId}/image/image${fileExtension}`;
        const params = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: fileName,
            Body: image.buffer,
            ACL: 'public-read', // Đặt quyền truy cập công khai
        };

        const data = await s3.upload(params).promise();
        return data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        );
    } catch (error) {
        throw error;
    }
};

const userUploadImage = async (userId, file) => {
    try {
        const fileName = `PBL6/USER/IMAGE/${userId}_image`;
        const params = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ACL: 'public-read', // Đặt quyền truy cập công khai
        };

        const data = await s3.upload(params).promise();
        return data.Location.replace(
            'nyc3.digitaloceanspaces.com/audiomelodies',
            'https://audiomelodies.nyc3.cdn.digitaloceanspaces.com',
        );
    } catch (error) {
        throw error;
    }
};

const deleteFile = async (filePath) => {
    try {
        // console.log('file path: ', filePath);
        // const bucketName = 'audiomelodies'; // Tên bucket
        // const key = filePath.substring(filePath.indexOf(bucketName) + bucketName.length + 1); // Lấy key

        // console.log('key: ', key);
        // const params = {
        //     Bucket: bucketName,
        //     Key: key,
        // };

        // return s3.deleteObject(params).promise();

        // console.log('file path: ', filePath);
        const bucketName = 'audiomelodies'; // Tên bucket
        const params = {
            Bucket: bucketName,
            Key: filePath,
        };

        return s3.deleteObject(params).promise();
    } catch (error) {
        throw error;
    }
};

const deleteFolder = async (folderPath) => {
    const listParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Prefix: folderPath,
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Delete: { Objects: [] },
    };

    listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
    });

    await s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await deleteFolder(folderPath);
};

const copyFile = async (sourceKey, destinationKey) => {
    const bucketName = process.env.DO_SPACES_BUCKET;

    const params = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourceKey}`,
        Key: destinationKey,
        ACL: 'public-read', // Đặt quyền truy cập công khai
    };

    return s3.copyObject(params).promise();
};

const copyFolder = async (sourceFolder, destinationFolder) => {
    const bucketName = process.env.DO_SPACES_BUCKET;

    const listParams = {
        Bucket: bucketName,
        Prefix: sourceFolder,
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();
    console.log('test: ', destinationFolder);
    console.log('test: ', listedObjects);

    if (listedObjects.Contents.length === 0) return;

    const copyPromises = listedObjects.Contents.map(({ Key }) => {
        const destinationKey = Key.replace(sourceFolder, destinationFolder);
        console.log('copy: ', destinationKey);
        return copyFile(Key, destinationKey);
    });
    await Promise.all(copyPromises);
    if (listedObjects.IsTruncated) await copyFolder(sourceFolder, destinationFolder);
};

const moveFile = async (sourceKey, destinationKey) => {
    try {
        const bucketName = process.env.DO_SPACES_BUCKET;
        await s3.headObject({ Bucket: bucketName, Key: sourceKey }).promise();
        console.log('Source file exists.');

        await s3
            .copyObject({
                Bucket: bucketName,
                CopySource: `${bucketName}/${sourceKey}`,
                Key: destinationKey,
            })
            .promise();

        await s3
            .deleteObject({
                Bucket: bucketName,
                Key: sourceKey,
            })
            .promise();
    } catch (error) {
        throw error;
    }
};

const deleteFile2 = async ({ folderPath, fileName } = {}) => {
    try {
        // Lấy danh sách file trong bucket hoặc folder
        const listResponse = await s3
            .listObjectsV2({
                Bucket: process.env.DO_SPACES_BUCKET,
                Prefix: folderPath, // Chỉ tìm trong folder này
            })
            .promise();

        console.log('test file', listResponse);

        // Lọc file có tên "ava" bất kể phần mở rộng
        // const filesToDelete = listResponse.Contents.filter(
        //     (file) => file.Key.match(/\/${fileName}\.[^/]+$/), // Match "ava" với bất kỳ đuôi file nào
        // ).map((file) => ({ Key: file.Key }));

        const regex = new RegExp(`/${fileName}\\.[^/]+$`);
        const filesToDelete = listResponse.Contents.filter((file) => regex.test(file.Key)).map((file) => ({
            Key: file.Key,
        }));

        console.log('test filesToDelete', filesToDelete);

        if (filesToDelete.length === 0) {
            console.log('Không tìm thấy file ava.');
            return;
        }

        // // Xóa file
        // await s3
        //     .deleteObjects({
        //         Bucket: process.env.DO_SPACES_BUCKET,
        //         Delete: {
        //             Objects: filesToDelete,
        //         },
        //     })
        //     .promise();
    } catch (error) {
        throw error;
    }
};

const deleteFile3 = async (filePath) => {
    try {
        const bucketName = process.env.DO_SPACES_BUCKET;

        const params = {
            Bucket: bucketName,
            Key: filePath,
        };

        try {
            await s3.headObject(params).promise();
        } catch (err) {
            if (err.code === 'NotFound') {
                console.log(`File không tồn tại: ${filePath}`);
                return;
            }
            throw err;
        }

        await s3.deleteObject(params).promise();
        console.log(`File đã được xóa: ${filePath}`);
    } catch (error) {
        throw error;
    }
};

export const awsService = {
    uploadArtistAvatar,
    uploadPlaylistAvatar,
    uploadSong,
    uploadSongLyric,
    uploadSongWithLyric,
    uploadLyricFile,
    uploadAlbumCover,
    userUploadSong,
    userUploadSongLyric,
    userUploadSongImage,
    userUploadImage,
    deleteFile,
    deleteFile2,
    deleteFolder,
    copyFile,
    copyFolder,
    moveFile,
    deleteFile3,
};
