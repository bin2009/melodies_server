import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
});

const uploadArtistAvatar = async (artistId, file) => {
    console.log('file: ', file);
    const fileName = `PBL6/ARTIST/${artistId}/avatar_${file.originalname}`;
    const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: file.buffer,
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

const uploadSong = async (mainArtistId, songId, file) => {
    console.log('upload song', file);
    const fileName = `PBL6/ARTIST/${mainArtistId}/SONG/${songId}_${file.originalname}`;
    const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read', // Đặt quyền truy cập công khai
    };

    const data = await s3.upload(params).promise();
    return data.Location;
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

const deleteFile = async (filePath) => {
    console.log('file path: ', filePath);
    const bucketName = 'audiomelodies'; // Tên bucket
    const key = filePath.substring(filePath.indexOf(bucketName) + bucketName.length + 1); // Lấy key

    console.log('key: ', key);
    const params = {
        Bucket: bucketName,
        Key: key,
    };

    return s3.deleteObject(params).promise();
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

export const awsService = {
    uploadArtistAvatar,
    uploadPlaylistAvatar,
    uploadSong,
    uploadAlbumCover,
    deleteFile,
    deleteFolder,
    copyFile,
    copyFolder,
};
