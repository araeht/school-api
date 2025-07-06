import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   - name: Teachers
 *     description: Teacher management
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
 *                 example: John Smith
 *               department:
 *                 type: string
 *                 example: Mathematics
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       500:
 *         description: Internal server error
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
 *     summary: Get all teachers
 *     tags: [Teachers]
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
 *           enum: [id, name, department, createdAt, updatedAt]
 *           default: id
 *         description: Sort by field
 *     responses:
 *       200:
 *         description: List of teachers with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       department:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       Courses:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             title:
 *                               type: string
 *                             description:
 *                               type: string
 */
export const getAllTeachers = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  const sort = req.query.sort === 'desc' ? 'DESC' : 'ASC';
  const allowedSortFields = ['id', 'name', 'department', 'createdAt', 'updatedAt'];
  const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'id';

  try {
    const total = await db.Teacher.count();

    const teachers = await db.Teacher.findAll({
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy, sort]],
      include: {
        model: db.Course,
        attributes: ['id', 'title', 'description'],
      },
      attributes: ['id', 'name', 'department', 'createdAt', 'updatedAt'],
    });

    res.json({
      meta: {
        totalItems: total,
        page,
        totalPages: Math.ceil(total / limit),
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
 *         schema:
 *           type: integer
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [none, courses]
 *           default: none
 *         description: >
 *           Use 'none' to skip courses or 'courses' to include all courses taught by this teacher.
 *     responses:
 *       200:
 *         description: Teacher found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 department:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 Courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *       404:
 *         description: Not found
 */
export const getTeacherById = async (req, res) => {
  const { id } = req.params;
  const populate = (req.query.populate || 'none').toLowerCase();

  const include = [];

  if (populate === 'courses') {
    include.push({
      model: db.Course,
      attributes: ['id', 'title', 'description'],
    });
  }

  try {
    const teacher = await db.Teacher.findByPk(id, {
      include,
      attributes: ['id', 'name', 'department', 'createdAt', 'updatedAt'],
    });

    if (!teacher) return res.status(404).json({ message: 'Not found' });

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
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       404:
 *         description: Teacher not found
 */
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await db.Teacher.findByPk(id);

    if (!teacher) return res.status(404).json({ message: 'Not found' });

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
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Teacher deleted successfully
 *       404:
 *         description: Teacher not found
 */
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await db.Teacher.findByPk(id);

    if (!teacher) {
      return res.status(404).json({ message: 'Not found' });
    }

    await teacher.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
