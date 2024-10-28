const albumService = require('../services/albumService');

const getMoreAlbum = async (req, res) => {
    const albumId = req.params.id;
    // if (!albumId) {
    //     return res.status(400).json({
    //         errCode: 400,
    //         message: 'Album id required',
    //     });
    // }
    const response = await albumService.getMoreAlbumService(albumId);
    return res.status(response.errCode).json(response);
};

const getAllAlbum = async (req, res) => {
    const response = await albumService.getAllAlbumService(req.query.offset);
    return res.status(response.errCode).json(response);
};

const getTopAlbum = async (req, res) => {
    const response = await albumService.getTopAlbumService(req.query.offset);
    return res.status(response.errCode).json(response);
};

module.exports = {
    getMoreAlbum,
    getAllAlbum,
    getTopAlbum,
};
