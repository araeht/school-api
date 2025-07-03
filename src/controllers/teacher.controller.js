import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   - name: Teachers
 *     description: Teacher management
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     TeacherPopulateParam:
 *       in: query
 *       name: populate
 *       schema:
 *         type: string
 *         enum: [courses, all]
 *       description: Include related data (courses or all)
 */

/**
 * @swagger
 * /teachers:
 *   post:
 *     summary: Create a new teacher
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, department]
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       500:
 *         description: Server error
 */
export const createTeacher = async (req, res) => {
    try {
        const teacher = await db.Teacher.create(req.body);
        res.status(201).json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers:
 *   get:
 *     summary: Get all teachers with pagination, sorting, and population
 *     tags: [Teachers]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of records per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order by creation date
 *       - $ref: '#/components/parameters/TeacherPopulateParam'
 *     responses:
 *       200:
 *         description: List of teachers with metadata
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
export const getAllTeachers = async (req, res) => {
    try {
        // Parse and validate query parameters
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const sort = req.query.sort || 'desc';
        const populate = req.query.populate;

        // Validation
        if (limit < 1 || limit > 100) {
            return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }
        if (page < 1) {
            return res.status(400).json({ error: 'Page must be greater than 0' });
        }
        if (!['asc', 'desc'].includes(sort)) {
            return res.status(400).json({ error: 'Sort must be either asc or desc' });
        }

        // Build include array for eager loading
        const includeOptions = [];
        if (populate) {
            const populateOptions = populate.split(',').map(p => p.trim());
            
            if (populateOptions.includes('courses') || populateOptions.includes('all')) {
                includeOptions.push({
                    model: db.Course,
                    include: [db.Student] // Include students enrolled in courses
                });
            }
        }

        // Build query options
        const queryOptions = {
            limit: limit,
            offset: (page - 1) * limit,
            order: [['createdAt', sort.toUpperCase()]],
            ...(includeOptions.length > 0 && { include: includeOptions })
        };

        // Execute queries
        const total = await db.Teacher.count();
        const teachers = await db.Teacher.findAll(queryOptions);

        res.json({
            meta: {
                totalItems: total,
                page: page,
                totalPages: Math.ceil(total / limit),
                limit: limit
            },
            data: teachers,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers/{id}:
 *   get:
 *     summary: Get a teacher by ID
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Teacher ID
 *       - $ref: '#/components/parameters/TeacherPopulateParam'
 *     responses:
 *       200:
 *         description: Teacher found
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
export const getTeacherById = async (req, res) => {
    try {
        const populate = req.query.populate;
        
        // Build include array for eager loading
        const includeOptions = [];
        if (populate) {
            const populateOptions = populate.split(',').map(p => p.trim());
            
            if (populateOptions.includes('courses') || populateOptions.includes('all')) {
                includeOptions.push({
                    model: db.Course,
                    include: [db.Student] // Include students enrolled in courses
                });
            }
        }

        const queryOptions = {
            ...(includeOptions.length > 0 && { include: includeOptions })
        };

        const teacher = await db.Teacher.findByPk(req.params.id, queryOptions);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        res.json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers/{id}:
 *   put:
 *     summary: Update a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Teacher ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
export const updateTeacher = async (req, res) => {
    try {
        const teacher = await db.Teacher.findByPk(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        await teacher.update(req.body);
        res.json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher deleted successfully
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
export const deleteTeacher = async (req, res) => {
    try {
        const teacher = await db.Teacher.findByPk(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        await teacher.destroy();
        res.json({ message: 'Teacher deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};