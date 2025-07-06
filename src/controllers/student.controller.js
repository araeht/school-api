import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   - name: Students
 *     description: Student management
 */

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *     responses:
 *       201:
 *         description: Student created successfully
 *       500:
 *         description: Internal server error
 */
export const createStudent = async (req, res) => {
    try {
        const student = await db.Student.create(req.body);
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *           enum: [id, name, email, createdAt, updatedAt]
 *           default: id
 *         description: Sort students by field
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [none, courses]
 *           default: none
 *         description: >
 *           Select 'none' to include only course IDs,
 *           or 'courses' to include full course details for enrolled courses.
 *     responses:
 *       200:
 *         description: List of students with metadata
 */
export const getAllStudents = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const sort = req.query.sort === 'desc' ? 'DESC' : 'ASC';
    const sortBy = ['id', 'name', 'email', 'createdAt', 'updatedAt'].includes(req.query.sortBy)
        ? req.query.sortBy
        : 'id';

    const populate = (req.query.populate || 'none').toLowerCase();

    const include = [];

    if (populate === 'courses') {
        include.push({
            model: db.Course,
            attributes: ['id', 'title', 'description', 'teacherId', 'createdAt', 'updatedAt'],
            through: { attributes: [] }, // hide join table attributes
        });
    } else {
        include.push({
            model: db.Course,
            attributes: ['id'],
            through: { attributes: [] },
        });
    }

    try {
        const total = await db.Student.count();

        const students = await db.Student.findAll({
            limit,
            offset: (page - 1) * limit,
            order: [[sortBy, sort]],
            include,
            attributes: include.length === 0 ? ['id', 'name', 'email', 'createdAt', 'updatedAt'] : undefined,
        });

        res.json({
            meta: {
                totalItems: total,
                page,
                totalPages: Math.ceil(total / limit),
            },
            data: students,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [none, courses]
 *           default: none
 *         description: >
 *           Select 'none' to include only course IDs,
 *           or 'courses' to include full course details for enrolled courses.
 *     responses:
 *       200:
 *         description: A student
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
export const getStudentById = async (req, res) => {
    try {
        const populate = (req.query.populate || 'none').toLowerCase();

        const include = [];

        if (populate === 'courses') {
            include.push({
                model: db.Course,
                attributes: ['id', 'title', 'description', 'teacherId', 'createdAt', 'updatedAt'],
            });
        } else {
            include.push({
                model: db.Course,
                attributes: ['id'],
                through: { attributes: [] },
            });
        }

        const student = await db.Student.findByPk(req.params.id, { include });

        if (!student) return res.status(404).json({ message: 'Not found' });

        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
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
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 example: jane.doe@example.com
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
export const updateStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Not found' });
        await student.update(req.body);
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
export const deleteStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        await student.destroy();
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
