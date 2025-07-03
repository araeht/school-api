export default (sequelize, DataTypes) =>
    sequelize.define('Course', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [3, 200]
            }
        },
        courseCode: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
            comment: 'Unique course code (e.g., CS101, MATH201)'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        credits: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 3,
            validate: {
                min: 1,
                max: 10
            }
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Duration in weeks'
        },
        maxStudents: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 30,
            validate: {
                min: 1
            }
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
                isAfterStartDate(value) {
                    if (value && this.startDate && value <= this.startDate) {
                        throw new Error('End date must be after start date');
                    }
                }
            }
        },
        schedule: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Class schedule information (days, times, room)'
        },
        status: {
            type: DataTypes.ENUM('draft', 'active', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'draft'
        },
        level: {
            type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            allowNull: false,
            defaultValue: 'beginner'
        },
        prerequisites: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Course prerequisites'
        },
        syllabus: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Course syllabus content'
        },
        department: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        room: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Classroom or location'
        }
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['courseCode']
            },
            {
                fields: ['status']
            },
            {
                fields: ['level']
            },
            {
                fields: ['department']
            },
            {
                fields: ['startDate']
            },
            {
                fields: ['TeacherId']
            }
        ],
        hooks: {
            beforeCreate: async (course) => {
                // Auto-generate course code if not provided
                if (!course.courseCode) {
                    const dept = course.department ? course.department.substring(0, 3).toUpperCase() : 'GEN';
                    const count = await sequelize.models.Course.count() + 1;
                    course.courseCode = `${dept}${count.toString().padStart(3, '0')}`;
                }
            }
        }
    });