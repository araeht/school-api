import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   - name: Courses
 *     description: Course management
 */

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, teacherId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               teacherId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Course created
 *       500:
 *         description: Internal server error
 */
export const createCourse = async (req, res) => {
    try {
        const course = await db.Course.create(req.body);
        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (asc or desc)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, createdAt, updatedAt, teacherId]
 *           default: id
 *         description: Sort Course By
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: integer
 *         description: Filter Course with teacher ID
 *         required: false
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [none, teacher]
 *           default: none
 *         description: Optional. Default is "none" (includes only teacherId). Use "teacher" to include full Teacher details (id, name, department).
 *     responses:
 *       200:
 *         description: List of courses with metadata
 */
export const getAllCourses = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const sort = req.query.sort === 'desc' ? 'DESC' : 'ASC';
    const sortBy = ['id', 'createdAt', 'updatedAt', 'teacherId'].includes(req.query.sortBy)
        ? req.query.sortBy
        : 'id';

    const where = {};
    if (req.query.teacherId) {
        where.teacherId = req.query.teacherId;
    }

    const populate = (req.query.populate || 'none').toLowerCase();

    const include = [];

    if (populate === 'teacher') {
        include.push({
            model: db.Teacher,
            attributes: ['id', 'name', 'department'],
        });
    }

    try {
        const total = await db.Course.count({ where });

        const courses = await db.Course.findAll({
            limit,
            offset: (page - 1) * limit,
            order: [[sortBy, sort]],
            where,
            include,
            attributes: include.length === 0
                ? ['id', 'title', 'description', 'teacherId', 'createdAt', 'updatedAt']
                : undefined,
        });

        res.json({
            meta: {
                totalItems: total,
                page,
                totalPages: Math.ceil(total / limit),
            },
            data: courses,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [none, teacher]
 *           default: none
 *         description: >
 *           _Select (none) only teacherId is include
 *           _Select (teacher) include with teacher details
 *     responses:
 *       200:
 *         description: Course found
 *       404:
 *         description: Not found
 */
export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const populate = (req.query.populate || 'none').toLowerCase();

        const include = [];

        if (populate === 'teacher') {
            include.push({
                model: db.Teacher,
                attributes: ['id', 'name', 'department'] // ✅ fixed: only fields that exist
            });
        }

        const course = await db.Course.findByPk(id, { include });

        if (!course) return res.status(404).json({ message: 'Not found' });

        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introduction to Node.js
 *               description:
 *                 type: string
 *                 example: Learn the basics of Node.js and Express.
 *               teacherId:
 *                 type: integer
 *                 example: 3
 *             required:
 *               - title
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
export const updateCourse = async (req, res) => {
    try {
        const course = await db.Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Not found' });
        }

        await course.update(req.body);
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
export const deleteCourse = async (req, res) => {
    try {
        const course = await db.Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        
        await course.destroy();
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
