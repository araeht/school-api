export default (sequelize, DataTypes) =>
    sequelize.define('Teacher', {
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
        employeeId: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
            comment: 'Unique employee identifier'
        },
        department: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        position: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Job title/position'
        },
        qualifications: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Educational qualifications and certifications'
        },
        specialization: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Area of specialization or expertise'
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
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
                isDate: true,
                isBefore: new Date().toISOString().split('T')[0]
            }
        },
        hireDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        salary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            validate: {
                min: 0
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated'),
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
                fields: ['employeeId']
            },
            {
                fields: ['department']
            },
            {
                fields: ['status']
            },
            {
                fields: ['hireDate']
            }
        ],
        hooks: {
            beforeCreate: async (teacher) => {
                // Auto-generate employee ID if not provided
                if (!teacher.employeeId) {
                    const year = new Date().getFullYear();
                    const count = await sequelize.models.Teacher.count() + 1;
                    teacher.employeeId = `EMP${year}${count.toString().padStart(4, '0')}`;
                }
            }
        }
    });
