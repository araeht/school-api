import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   - name: Students
 *     description: Student management
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     StudentPopulateParam:
 *       in: query
 *       name: populate
 *       schema:
 *         type: string
 *         enum: [courses, all]
 *       description: Include related data (courses or all)
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
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Student created successfully
 *       500:
 *         description: Server error
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
 *     summary: Get all students with pagination, sorting, and population
 *     tags: [Students]
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
 *       - $ref: '#/components/parameters/StudentPopulateParam'
 *     responses:
 *       200:
 *         description: List of students with metadata
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
export const getAllStudents = async (req, res) => {
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
                    include: [db.Teacher] // Include teacher info in courses for more complete data
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
        const total = await db.Student.count();
        const students = await db.Student.findAll(queryOptions);

        res.json({
            meta: {
                totalItems: total,
                page: page,
                totalPages: Math.ceil(total / limit),
                limit: limit
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Student ID
 *       - $ref: '#/components/parameters/StudentPopulateParam'
 *     responses:
 *       200:
 *         description: Student found
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
export const getStudentById = async (req, res) => {
    try {
        const populate = req.query.populate;
        
        // Build include array for eager loading
        const includeOptions = [];
        if (populate) {
            const populateOptions = populate.split(',').map(p => p.trim());
            
            if (populateOptions.includes('courses') || populateOptions.includes('all')) {
                includeOptions.push({
                    model: db.Course,
                    include: [db.Teacher] // Include teacher info in courses
                });
            }
        }

        const queryOptions = {
            ...(includeOptions.length > 0 && { include: includeOptions })
        };

        const student = await db.Student.findByPk(req.params.id, queryOptions);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
export const updateStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
export const deleteStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        await student.destroy();
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};