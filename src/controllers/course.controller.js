import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   - name: Courses
 *     description: Course management
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     CoursePopulateParam:
 *       in: query
 *       name: populate
 *       schema:
 *         type: string
 *         enum: [teacher, students, all]
 *       description: Include related data (teacher, students, or all)
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
 *             required: [title, description, TeacherId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               TeacherId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Course created successfully
 *       500:
 *         description: Server error
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
 *     summary: Get all courses with pagination, sorting, and population
 *     tags: [Courses]
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
 *       - $ref: '#/components/parameters/CoursePopulateParam'
 *     responses:
 *       200:
 *         description: List of courses with metadata
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
export const getAllCourses = async (req, res) => {
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
            
            if (populateOptions.includes('teacher') || populateOptions.includes('all')) {
                includeOptions.push(db.Teacher);
            }
            if (populateOptions.includes('students') || populateOptions.includes('all')) {
                includeOptions.push(db.Student);
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
        const total = await db.Course.count();
        const courses = await db.Course.findAll(queryOptions);

        res.json({
            meta: {
                totalItems: total,
                page: page,
                totalPages: Math.ceil(total / limit),
                limit: limit
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
 *         schema: { type: integer }
 *         description: Course ID
 *       - $ref: '#/components/parameters/CoursePopulateParam'
 *     responses:
 *       200:
 *         description: Course found
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
export const getCourseById = async (req, res) => {
    try {
        const populate = req.query.populate;
        
        // Build include array for eager loading
        const includeOptions = [];
        if (populate) {
            const populateOptions = populate.split(',').map(p => p.trim());
            
            if (populateOptions.includes('teacher') || populateOptions.includes('all')) {
                includeOptions.push(db.Teacher);
            }
            if (populateOptions.includes('students') || populateOptions.includes('all')) {
                includeOptions.push(db.Student);
            }
        }

        const queryOptions = {
            ...(includeOptions.length > 0 && { include: includeOptions })
        };

        const course = await db.Course.findByPk(req.params.id, queryOptions);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
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
 *         schema: { type: integer }
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               TeacherId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
export const updateCourse = async (req, res) => {
    try {
        const course = await db.Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
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
 *         schema: { type: integer }
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
export const deleteCourse = async (req, res) => {
    try {
        const course = await db.Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        await course.destroy();
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};