const albumService = require('../services/albumService');

const getAlbum = async (req, res) => {
    const albumId = req.params.id;
    // if (!albumId) {
    //     return res.status(400).json({
    //         errCode: 400,
    //         message: 'Album id required',
    //     });
    // }
    // return res.status(200).json("jaj")
    const response = await albumService.getAlbumService(albumId);
    return res.status(response.errCode).json(response);
};

const getAllAlbum = async (req, res) => {
    const response = await albumService.getAllAlbumService(req.query.offset);
    return res.status(response.errCode).json(response);
};

module.exports = {
    getAlbum,
    getAllAlbum,
};
