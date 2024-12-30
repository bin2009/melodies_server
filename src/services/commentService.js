import db from '~/models';
import { Op } from 'sequelize';
import formatTime from '~/utils/timeFormat';

const DO_SPACES_BUCKET = process.env.DO_SPACES_BUCKET;
const DO_SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT;

const checkCommentExits = async (commentId) => {
    return await db.Comment.findByPk(commentId);
};

const fetchCommentCount = async ({ conditions = {} } = {}) => {
    const commentCount = await db.Comment.count({ where: conditions });
    return commentCount;
};

const fetchAllComment = async ({
    limit = undefined,
    offset = undefined,
    conditions = {},
    order = [['updatedAt', 'DESC']],
} = {}) => {
    const comments = await db.Comment.findAll({
        where: conditions,
        include: [
            {
                model: db.User,
                as: 'user',
                attributes: ['id', 'username', 'image', 'accountType', 'name'],
            },
        ],
        attributes: ['id', 'commentParentId', 'userId', 'content', 'createdAt', 'hide'],
        order: order,
        limit: limit,
        offset: offset,
    });

    const formattedComments = comments.map((c) => {
        const formattedComment = { ...c.toJSON() };
        formattedComment.createdAt = formatTime(formattedComment.createdAt);
        return formattedComment;
    });

    return formattedComments;
};

const fetchCountCommentChild = async ({ conditions = {} } = {}) => {
    const comments = await db.Comment.findAll({
        where: conditions,
        attributes: ['commentParentId', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalComment']],
        group: ['Comment.commentParentId'],
        raw: true,
    });

    return comments;
};
const getRecentCommentService = async ({ page = 1, limit = 8 }) => {
    try {
        const offset = (page - 1) * limit;
        const [comments, totalComment] = await Promise.all([
            fetchAllComment({ limit: limit, offset: offset }),
            fetchCommentCount(),
        ]);

        const formattedComments = comments.map((c) => {
            const { user, ...other } = c;
            return {
                ...other,
                userId: user.id,
                name: user.name,
                username: user.username,
                image:
                    user.image && user.image.includes('PBL6')
                        ? `https://${DO_SPACES_BUCKET}.${DO_SPACES_ENDPOINT}/${user.image}`
                        : user.image,
            };
        });
        return {
            page: page,
            totalPage: Math.ceil(totalComment / limit),
            comments: formattedComments,
        };
    } catch (error) {
        throw error;
    }
};

export const commentService = {
    checkCommentExits,
    fetchCommentCount,
    fetchAllComment,
    fetchCountCommentChild,
    getRecentCommentService,
};
