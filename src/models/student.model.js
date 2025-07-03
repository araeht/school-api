export default (sequelize, DataTypes) =>
    sequelize.define('Student', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        studentId: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
            comment: 'Unique student identifier/registration number'
        },
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
                isDate: true,
                isBefore: new Date().toISOString().split('T')[0] // Must be before today
            }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^[+]?[\d\s\-\(\)]+$/
            }
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        enrollmentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
            allowNull: false,
            defaultValue: 'active'
        },
        profilePicture: {
            type: DataTypes.STRING(500),
            allowNull: true,
            validate: {
                isUrl: true
            }
        }
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                unique: true,
                fields: ['studentId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['enrollmentDate']
            }
        ],
        hooks: {
            beforeCreate: async (student) => {
                // Auto-generate student ID if not provided
                if (!student.studentId) {
                    const year = new Date().getFullYear();
                    const count = await sequelize.models.Student.count() + 1;
                    student.studentId = `STU${year}${count.toString().padStart(4, '0')}`;
                }
            }
        }
    });