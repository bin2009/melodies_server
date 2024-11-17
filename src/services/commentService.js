import db from '~/models';
import { Op } from 'sequelize';

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
    order = [['createdAt', 'DESC']],
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

    return comments;
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
            const { user, ...other } = c.toJSON();
            return {
                ...other,
                userId: user.id,
                name: user.name,
                username: user.username,
                image: user.image,
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
